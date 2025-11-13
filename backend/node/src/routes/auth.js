import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';

const router = express.Router();

const COOKIE_NAME = process.env.COOKIE_NAME || 'med_token';
const COOKIE_SECURE = (process.env.COOKIE_SECURE || 'false') === 'true';

function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: 'lax',
    path: '/',
    maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
  });
}

router.post('/register', async (req, res) => {
  try {
    let { username, email, password, role } = req.body;
    username = String(username || '').trim().toLowerCase();
    email = String(email || '').trim().toLowerCase();
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email and password are required' });
    }
    const existingUser = await User.findOne({ username }).collation({ locale: 'en', strength: 2 });
    if (existingUser) return res.status(409).json({ message: 'Username already exists' });
    const existingEmail = await User.findOne({ email }).collation({ locale: 'en', strength: 2 });
    if (existingEmail) return res.status(409).json({ message: 'Email already exists' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, passwordHash, role: role || 'doctor' });

    await AuditLog.create({ username, action: 'register', details: { role: user.role, email } });
    return res.status(201).json({ message: 'Registered successfully' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const username = String(req.body.username || '').trim().toLowerCase();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = req.body.password;
    let user = null;
    if (email) {
      user = await User.findOne({ email }).collation({ locale: 'en', strength: 2 });
    } else if (username) {
      user = await User.findOne({ username }).collation({ locale: 'en', strength: 2 });
    }
    if (!user) {
      await AuditLog.create({ username: username || email, action: 'login', success: false });
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      await AuditLog.create({ username: user.username, action: 'login', success: false });
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user._id, username: user.username, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    setAuthCookie(res, token);
    await AuditLog.create({ username: user.username, action: 'login', success: true });
    return res.json({ message: 'Logged in' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.post('/logout', async (req, res) => {
  try {
    res.clearCookie(COOKIE_NAME, { path: '/' });
    if (req.user) {
      await AuditLog.create({ username: req.user.username, action: 'logout' });
    }
    return res.json({ message: 'Logged out' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

function authMiddleware(req, res, next) {
  const token = req.cookies[COOKIE_NAME];
  if (!token) return res.status(401).json({ message: 'Not authenticated' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

router.get('/me', authMiddleware, async (req, res) => {
  const displayName = (req.user.username || '').replace(/^([a-z])/,
    (m, p1) => p1.toUpperCase());
  return res.json({ user: { id: req.user.id, username: req.user.username, email: req.user.email, role: req.user.role, displayName } });
});

export { authMiddleware };
export default router;
