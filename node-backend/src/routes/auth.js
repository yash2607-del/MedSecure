import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';

const router = express.Router();

const signToken = (username, role) => jwt.sign({ sub: username, role }, process.env.JWT_SECRET, { expiresIn: '8h' });

router.post('/register', async (req, res) => {
  try {
    const { username, password, role } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username & password required' });
    const existing = await User.findOne({ username });
    if (existing) return res.status(409).json({ error: 'User exists' });
    const passwordHash = await bcrypt.hash(password, 12);
    await User.create({ username, passwordHash, role: role || 'doctor' });
    await AuditLog.create({ username, action: 'REGISTER' });
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: 'Register failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = signToken(user.username, user.role);
    res.cookie(process.env.COOKIE_NAME || 'auth_token', token, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === 'true',
      sameSite: 'Strict',
      maxAge: 8 * 60 * 60 * 1000
    });
    await AuditLog.create({ username, action: 'LOGIN' });
    return res.json({ ok: true, role: user.role, username: user.username });
  } catch (e) {
    return res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/logout', (req, res) => {
  const username = req.user?.sub;
  res.clearCookie(process.env.COOKIE_NAME || 'auth_token');
  if (username) AuditLog.create({ username, action: 'LOGOUT' }).catch(()=>{});
  return res.json({ ok: true });
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

router.get('/me', authMiddleware, (req, res) => {
  res.json({ username: req.user.sub, role: req.user.role });
});

export default router;
