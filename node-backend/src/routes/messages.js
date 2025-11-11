import express from 'express';
import jwt from 'jsonwebtoken';
import Message from '../models/Message.js';
import AuditLog from '../models/AuditLog.js';
import axios from 'axios';

const router = express.Router();

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

// Encrypt & send (delegates to python stego microservice)
router.post('/send', authMiddleware, async (req, res) => {
  try {
    const { patient_id, patient_name, recipient, data, file_url, cipher_text } = req.body;
    if (!patient_id || !patient_name || !recipient || !data || !file_url || !cipher_text) {
      return res.status(400).json({ error: 'Missing fields' });
    }
    await Message.create({ sender: req.user.sub, recipient, patient_id, patient_name, file_url, cipher_text });
    await AuditLog.create({ username: req.user.sub, action: 'SEND_MESSAGE', patient_id });
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: 'Send failed' });
  }
});

router.get('/inbox', authMiddleware, async (req, res) => {
  const messages = await Message.find({ recipient: req.user.sub }).sort({ created_at: -1 });
  res.json({ messages });
});

router.post('/decrypt', authMiddleware, async (req, res) => {
  try {
    const { message_id } = req.body;
    const message = await Message.findById(message_id);
    if (!message || message.recipient !== req.user.sub) return res.status(404).json({ error: 'Not found' });
    // call python microservice to decrypt
    const stegoRes = await axios.post(`${process.env.STEGO_SERVICE_URL}/decrypt`, { cipher_text: message.cipher_text });
    if (!message.decrypted) {
      message.decrypted = true;
      message.decrypted_at = new Date();
      await message.save();
    }
    await AuditLog.create({ username: req.user.sub, action: 'DECRYPT_MESSAGE', patient_id: message.patient_id });
    return res.json({ data: stegoRes.data.data });
  } catch (e) {
    return res.status(500).json({ error: 'Decrypt failed' });
  }
});

export default router;
