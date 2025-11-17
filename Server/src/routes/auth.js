import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';

const router = express.Router();

const signToken = (username, email, role) => jwt.sign({ sub: username, email, role }, process.env.JWT_SECRET, { expiresIn: '8h' });

router.post('/register', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username & password required' });
    const exists = await User.findOne({ $or: [{ username }, { email: email?.toLowerCase() }] });
    if (exists) return res.status(409).json({ error: 'User exists' });
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ username, email: email?.toLowerCase(), passwordHash, role: role || 'doctor' });
    await AuditLog.create({ username: user.username, action: 'REGISTER' });
    return res.json({ ok: true, user: { username: user.username, email: user.email, role: user.role } });
  } catch (e) {
    return res.status(500).json({ error: 'Register failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, email, identifier, password } = req.body;
    const id = (identifier || email || username || '').toString();
    const query = id.includes('@') ? { email: id.toLowerCase() } : { username: id };
    const user = await User.findOne(query);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = signToken(user.username, user.email, user.role);
    res.cookie(process.env.COOKIE_NAME || 'auth_token', token, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === 'true',
      sameSite: 'Strict',
      maxAge: 8 * 60 * 60 * 1000
    });
    await AuditLog.create({ username: user.username, action: 'LOGIN' });
    return res.json({ ok: true, user: { username: user.username, email: user.email, role: user.role } });
  } catch (e) {
    return res.status(500).json({ error: 'Login failed' });
  }
});

const authMiddleware = (req, res, next) => {
  const token = req.cookies[process.env.COOKIE_NAME || 'auth_token'];
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

router.post('/logout', authMiddleware, (req, res) => {
  const username = req.user?.sub;
  res.clearCookie(process.env.COOKIE_NAME || 'auth_token');
  if (username) AuditLog.create({ username, action: 'LOGOUT' }).catch(()=>{});
  return res.json({ ok: true });
});

router.get('/me', authMiddleware, (req, res) => {
  res.json({ user: { username: req.user.sub, email: req.user.email, role: req.user.role } });
});

// Fetch full profile for the logged-in user
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.user.sub }).select('username email role createdAt');
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({
      user: {
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to load profile' });
  }
});

// Update profile fields: username, email
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { username, email } = req.body || {};
    const user = await User.findOne({ username: req.user.sub });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const oldUsername = user.username;

    // Username uniqueness check if changed
    if (typeof username === 'string' && username.trim() && username !== user.username) {
      const trimmed = username.trim();
      if (trimmed.length < 3) return res.status(400).json({ error: 'Username must be at least 3 characters' });
      const exists = await User.findOne({ username: trimmed });
      if (exists) return res.status(409).json({ error: 'Username already taken' });
      user.username = trimmed;
    }

    // Email uniqueness check if changed
    if (typeof email === 'string' && email.toLowerCase() !== (user.email || '').toLowerCase()) {
      const exists = await User.findOne({ email: email.toLowerCase() });
      if (exists) return res.status(409).json({ error: 'Email already in use' });
      user.email = email.toLowerCase();
    }

    await user.save();
    await AuditLog.create({ username: user.username, action: 'UPDATE_PROFILE', details: `Changed from ${oldUsername}` }).catch(() => {});

    // Issue new token if username changed
    let newToken = null;
    if (user.username !== oldUsername) {
      newToken = signToken(user.username, user.email, user.role);
      res.cookie(process.env.COOKIE_NAME || 'auth_token', newToken, {
        httpOnly: true,
        secure: process.env.COOKIE_SECURE === 'true',
        sameSite: 'Strict',
        maxAge: 8 * 60 * 60 * 1000
      });
    }

    return res.json({
      ok: true,
      user: {
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      },
      tokenRefreshed: !!newToken
    });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;
