import express from 'express';
import AuditLog from '../models/AuditLog.js';
import { authMiddleware } from './auth.js';

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { role, username } = req.user;
    const query = role === 'admin' ? {} : { username };
    const logs = await AuditLog.find(query).sort({ created_at: -1 }).limit(250).lean();
    return res.json({ logs });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

export default router;
