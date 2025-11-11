import express from 'express';
import axios from 'axios';
import Message from '../models/Message.js';
import AuditLog from '../models/AuditLog.js';
import { authMiddleware } from './auth.js';

const router = express.Router();

router.post('/send', authMiddleware, async (req, res) => {
  try {
    const { recipient, patient_id, patient_name, data } = req.body;
    if (!recipient || !patient_id || !patient_name || !data) {
      return res.status(400).json({ message: 'recipient, patient_id, patient_name, data are required' });
    }

    const stegoUrl = process.env.STEGO_SERVICE_URL || 'http://127.0.0.1:5001';
    const encResp = await axios.post(`${stegoUrl}/encrypt`, { payload: data });
    const cipher_text = encResp.data?.cipher_text;
    if (!cipher_text) return res.status(502).json({ message: 'Encryption failed' });

    const msg = await Message.create({
      sender: req.user.id,
      senderUsername: req.user.username,
      recipient,
      patient_id,
      patient_name,
      data_summary: typeof data === 'string' ? data.slice(0, 80) : JSON.stringify(data).slice(0, 80),
      cipher_text
    });

    await AuditLog.create({ username: req.user.username, action: 'send_message', patient_id, details: { messageId: msg._id, recipient } });

    return res.status(201).json({ message: 'Message stored', id: msg._id });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/inbox', authMiddleware, async (req, res) => {
  const { mine } = req.query;
  const query = mine === 'true' ? { recipient: req.user.username } : { recipient: req.user.username };
  const items = await Message.find(query).sort({ createdAt: -1 }).lean();
  return res.json({ items });
});

router.post('/decrypt/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const msg = await Message.findById(id);
    if (!msg) return res.status(404).json({ message: 'Not found' });
    if (msg.recipient !== req.user.username && req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });

    const stegoUrl = process.env.STEGO_SERVICE_URL || 'http://127.0.0.1:5001';
    const decResp = await axios.post(`${stegoUrl}/decrypt`, { cipher_text: msg.cipher_text });
    const payload = decResp.data?.payload;

    msg.decrypted = true;
    msg.decrypted_at = new Date();
    await msg.save();

    await AuditLog.create({ username: req.user.username, action: 'decrypt_message', patient_id: msg.patient_id, details: { messageId: msg._id } });

    return res.json({ payload });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

export default router;
