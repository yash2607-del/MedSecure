import express from 'express';
import axios from 'axios';
import Message from '../models/Message.js';
import AuditLog from '../models/AuditLog.js';
import { authMiddleware } from './auth.js';

const router = express.Router();

function caesarMono(str, shift = 3) {
  const a = 'a'.charCodeAt(0), z = 'z'.charCodeAt(0);
  const A = 'A'.charCodeAt(0), Z = 'Z'.charCodeAt(0);
  return String(str || '').split('').map(ch => {
    const c = ch.charCodeAt(0);
    if (c >= a && c <= z) {
      return String.fromCharCode(((c - a + shift) % 26) + a);
    }
    if (c >= A && c <= Z) {
      return String.fromCharCode(((c - A + shift) % 26) + A);
    }
    return ch;
  }).join('');
}

router.post('/send', authMiddleware, async (req, res) => {
  try {
    const { recipient, patient_id, patient_name, data } = req.body;
    if (!recipient || !patient_id || !patient_name || !data) {
      return res.status(400).json({ message: 'recipient, patient_id, patient_name, data are required' });
    }
    const recipientNorm = String(recipient).trim().toLowerCase();

    const stegoUrl = process.env.STEGO_SERVICE_URL || 'http://127.0.0.1:5001';
    const encResp = await axios.post(`${stegoUrl}/encrypt`, { payload: data });
    const cipher_text = encResp.data?.cipher_text;
    if (!cipher_text) return res.status(502).json({ message: 'Encryption failed' });

    // Also compute monoalphabetic (Caesar) cipher for the plaintext to return to sender
    const mono_cipher = caesarMono(data, 3);

    // Package a downloadable file from the cipher (fallback until stego-service returns media)
    const packaged = {
      b64: Buffer.from(cipher_text, 'utf8').toString('base64'),
      mime: 'application/octet-stream',
      filename: `message-${Date.now()}.enc`
    };

    const msg = await Message.create({
      sender: req.user.id,
      senderUsername: req.user.username,
      recipient: recipientNorm,
      patient_id,
      patient_name,
      data_summary: typeof data === 'string' ? data.slice(0, 80) : JSON.stringify(data).slice(0, 80),
      cipher_text,
      mono_cipher,
      packagedFile: packaged
    });

    await AuditLog.create({ username: req.user.username, action: 'send_message', patient_id, details: { messageId: msg._id, recipient: recipientNorm } });
    await AuditLog.create({ username: req.user.username, action: 'mono_encrypt', patient_id, details: { messageId: msg._id } });

    return res.status(201).json({ message: 'Message stored', id: msg._id, downloadAvailable: true, mono_cipher });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/inbox', authMiddleware, async (req, res) => {
  const items = await Message.find({ recipient: req.user.username })
    .sort({ createdAt: -1 })
    .select('-packagedFile.b64')
    .lean();
  return res.json({ items });
});

// Sent items for current user
router.get('/sent', authMiddleware, async (req, res) => {
  const items = await Message.find({ sender: req.user.id })
    .sort({ createdAt: -1 })
    .select('-packagedFile.b64')
    .lean();
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

// Download packaged encrypted file (stego or .enc fallback)
router.get('/:id/file', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const msg = await Message.findById(id).lean();
    if (!msg) return res.status(404).json({ message: 'Not found' });
    if (msg.recipient !== req.user.username && msg.sender?.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const pf = msg.packagedFile || {};
    if (!pf.b64) return res.status(404).json({ message: 'No packaged file' });
    const buf = Buffer.from(pf.b64, 'base64');
    res.setHeader('Content-Type', pf.mime || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${pf.filename || 'message.enc'}"`);
    return res.send(buf);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

export default router;
