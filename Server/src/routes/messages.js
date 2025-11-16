import express from 'express';
import jwt from 'jsonwebtoken';
import Message from '../models/Message.js';
import AuditLog from '../models/AuditLog.js';
import axios from 'axios';
import { v2 as cloudinary } from 'cloudinary';
import User from '../models/User.js';

const router = express.Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});
const CLOUDINARY_READY = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

const STEGO_BASE = process.env.STEGO_SERVICE_URL || 'http://127.0.0.1:6001';

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

const caesarShift = (text, shift = 3) => {
  const a = 'abcdefghijklmnopqrstuvwxyz';
  const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return (text || '').split('').map(ch => {
    const li = a.indexOf(ch);
    if (li !== -1) return a[(li + shift) % 26];
    const ui = A.indexOf(ch);
    if (ui !== -1) return A[(ui + shift) % 26];
    return ch;
  }).join('');
};

// Vigenère cipher (better than simple monoalphabetic like Caesar)
const vigenereCipher = (text, key = 'MEDSECURE') => {
  if (!text) return '';
  if (!key) return text;
  const a = 'abcdefghijklmnopqrstuvwxyz';
  const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const k = key.replace(/[^a-z]/gi, '') || 'MEDSECURE';
  let out = '';
  let ki = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const kl = k[ki % k.length];
    const shift = (a.indexOf(kl) !== -1 ? a.indexOf(kl) : A.indexOf(kl)) % 26;
    if (a.indexOf(ch) !== -1) {
      out += a[(a.indexOf(ch) + shift) % 26];
      ki++;
    } else if (A.indexOf(ch) !== -1) {
      out += A[(A.indexOf(ch) + shift) % 26];
      ki++;
    } else {
      out += ch;
    }
  }
  return out;
};

const extForMime = (mime) => {
  const map = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/webp': 'webp',
    'audio/wav': 'wav',
    'audio/x-wav': 'wav',
    'audio/mpeg': 'mp3',
    'audio/mp3': 'mp3'
  };
  return map[mime] || 'bin';
};

// Encrypt & send
router.post('/send', authMiddleware, async (req, res) => {
  try {
    const { patient_id, patient_name, recipient, data, file } = req.body;
    if (!patient_id || !patient_name || !recipient || !data) {
      return res.status(400).json({ message: 'patient_id, patient_name, recipient, data are required' });
    }
    const recipientKey = String(recipient).trim().toLowerCase();
    // Resolve recipient user by email or username to store canonical username
    let recipientUser = null;
    try {
      recipientUser = await User.findOne({ $or: [ { email: recipientKey }, { username: recipient } ] }).select('username email');
    } catch {}
    let encResp;
    try {
      encResp = await axios.post(`${STEGO_BASE}/encrypt`, {
        patient_id,
        patient_name,
        data,
        sender: req.user.sub,
        recipient: recipientUser?.username || recipientKey,
        file
      });
    } catch (err) {
      console.error('[encrypt] stego microservice failed:', err.message);
      return res.status(500).json({ message: 'Encryption service unreachable', error: err.message });
    }
    const cipher_text = encResp.data?.cipher_text;
    if (!cipher_text) return res.status(502).json({ message: 'Encryption failed (no cipher_text)' });
    const stego = encResp.data?.stego_file || null;
    const mono_cipher = caesarShift(data);
    const vigenere_cipher = vigenereCipher(data, process.env.VIGENERE_KEY || 'MEDSECURE');

    let file_url = null;
    let original_file_url = null;
    if (CLOUDINARY_READY) {
      if (stego?.b64) {
        try {
          const up = await cloudinary.uploader.upload(`data:${stego.mime};base64,${stego.b64}`, { folder: 'medsecure/stego', resource_type: 'auto' });
          file_url = up.secure_url;
        } catch (e) {
          console.warn('[cloudinary] stego upload failed', e.message);
        }
      }
      if (file?.b64) {
        try {
          const up = await cloudinary.uploader.upload(`data:${file.mime};base64,${file.b64}`, { folder: 'medsecure/original', resource_type: 'auto' });
          original_file_url = up.secure_url;
        } catch (e) {
          console.warn('[cloudinary] original upload failed', e.message);
        }
      }
    }

    // Packaged fallback
    const hasStego = !!(stego?.b64);
    let packaged;
    if (hasStego) {
      // Stego file: always use correct extension from stego.mime
      const stegoExt = extForMime(stego.mime);
      const stFilename = stego.filename && /\.[a-z0-9]+$/i.test(stego.filename)
        ? stego.filename
        : `stego.${stegoExt}`;
      packaged = {
        mime: stego.mime || 'application/octet-stream',
        filename: stFilename,
        stego: { b64: stego.b64, mime: stego.mime, filename: stFilename }
      };
      if (file?.b64) {
        // Always prefer the original filename if it exists and has an extension
        let oFilename;
        console.log('Original file data:', { filename: file.filename, mime: file.mime });
        if (file.filename && /\.[a-z0-9]+$/i.test(file.filename)) {
          // Filename already has extension, use it as-is
          oFilename = file.filename;
          console.log('Using original filename:', oFilename);
        } else {
          // No extension found, try to add one based on MIME type
          const origExt = extForMime(file.mime);
          oFilename = file.filename ? `${file.filename}.${origExt}` : `original.${origExt}`;
          console.log('Generated filename:', oFilename, 'from ext:', origExt);
        }
        packaged.original = { b64: file.b64, mime: file.mime, filename: oFilename };
      }
    } else {
      // No stego: fallback to encrypted token as .enc
      packaged = {
        b64: Buffer.from(cipher_text, 'utf8').toString('base64'),
        mime: 'application/octet-stream',
        filename: `message-${Date.now()}.enc`
      };
    }

    const created = await Message.create({
      sender: req.user.sub,
      senderUsername: req.user.sub,
      recipient: recipientKey,
      recipientUsername: recipientUser?.username || null,
      patient_id,
      patient_name,
      cipher_text,
      mono_cipher,
      vigenere_cipher,
      file_url,
      original_file_url,
      packagedFile: packaged
    });
    await AuditLog.create({ username: req.user.sub, action: 'SEND_MESSAGE', patient_id });
    return res.status(201).json({ id: created._id, mono_cipher });
  } catch (e) {
    console.error('[send] unexpected error:', e);
    return res.status(500).json({ message: 'Send failed', error: e.message });
  }
});

router.get('/inbox', authMiddleware, async (req, res) => {
  const recipientKey = (req.user.email || req.user.sub);
  const raw = await Message.find({ recipient: recipientKey })
    .sort({ created_at: -1 })
    .lean();

  // Build lookup for missing usernames
  const ids = new Set();
  for (const m of raw) {
    if (!m.senderUsername && m.sender) ids.add(m.sender);
    if (!m.recipientUsername && m.recipient) ids.add(m.recipient);
  }
  let dict = {};
  if (ids.size) {
    const keys = Array.from(ids);
    const users = await User.find({ $or: [ { username: { $in: keys } }, { email: { $in: keys } } ] }).select('username email').lean();
    users.forEach(u => {
      dict[u.username] = u.username;
      if (u.email) dict[u.email] = u.username;
    });
  }

  const items = raw.map(m => {
    const hasStego = Boolean(m.file_url || m.packagedFile?.stego?.b64);
    const hasOriginal = Boolean(m.original_file_url || m.packagedFile?.original?.b64);
    const hasEnc = Boolean(m.packagedFile?.b64 || m.cipher_text);
    const { packagedFile, ...rest } = m;
    const senderUsername = m.senderUsername || dict[m.sender] || null;
    const recipientUsername = m.recipientUsername || dict[m.recipient] || null;
    return { ...rest, senderUsername, recipientUsername, has_stego: hasStego, has_original: hasOriginal, has_enc: hasEnc };
  });
  res.json({ items });
});

router.get('/sent', authMiddleware, async (req, res) => {
  const raw = await Message.find({ sender: req.user.sub })
    .sort({ created_at: -1 })
    .lean();

  // Resolve recipients' usernames for older records
  const ids = new Set();
  for (const m of raw) {
    if (!m.recipientUsername && m.recipient) ids.add(m.recipient);
  }
  let dict = {};
  if (ids.size) {
    const keys = Array.from(ids);
    const users = await User.find({ $or: [ { username: { $in: keys } }, { email: { $in: keys } } ] }).select('username email').lean();
    users.forEach(u => {
      dict[u.username] = u.username;
      if (u.email) dict[u.email] = u.username;
    });
  }

  const items = raw.map(m => {
    const hasStego = Boolean(m.file_url || m.packagedFile?.stego?.b64);
    const hasOriginal = Boolean(m.original_file_url || m.packagedFile?.original?.b64);
    const hasEnc = Boolean(m.packagedFile?.b64 || m.cipher_text);
    const { packagedFile, ...rest } = m;
    const recipientUsername = m.recipientUsername || dict[m.recipient] || null;
    return { ...rest, recipientUsername, has_stego: hasStego, has_original: hasOriginal, has_enc: hasEnc };
  });
  res.json({ items });
});

router.post('/decrypt/:id', authMiddleware, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    const recipientKey = (req.user.email || req.user.sub);
    if (!message || message.recipient !== recipientKey) return res.status(404).json({ message: 'Not found' });
    let stegoRes;
    try {
      stegoRes = await axios.post(`${STEGO_BASE}/decrypt`, { cipher_text: message.cipher_text });
    } catch (err) {
      if (err.response) {
        return res
          .status(err.response.status || 500)
          .json({ message: err.response.data?.error || 'Decrypt failed', error: err.message });
      }
      return res.status(500).json({ message: 'Decrypt service unreachable', error: err.message });
    }
    if (!message.decrypted) {
      message.decrypted = true;
      message.decrypted_at = new Date();
      const decMsg = stegoRes.data.data?.message || stegoRes.data.data?.payload?.message || stegoRes.data.data;
      if (typeof decMsg === 'string') message.decrypted_message = decMsg;
      await message.save();
    }
    await AuditLog.create({ username: req.user.sub, action: 'DECRYPT_MESSAGE', patient_id: message.patient_id });
    return res.json({
      patient_id: message.patient_id,
      patient_name: message.patient_name,
      decrypted_message: message.decrypted_message || stegoRes.data.data?.message,
      payload: stegoRes.data.data
    });
  } catch (e) {
    return res.status(500).json({ message: 'Decrypt failed', error: e.message });
  }
});

// Extract and decrypt from stego media (image or audio)
router.post('/extract', authMiddleware, async (req, res) => {
  try {
    const { file } = req.body;
    if (!file || typeof file !== 'object' || !file.b64) {
      return res.status(400).json({ message: 'file {b64,mime,filename} required' });
    }
    let ex;
    try {
      ex = await axios.post(`${STEGO_BASE}/extract`, { file });
    } catch (err) {
      if (err.response) {
        return res
          .status(err.response.status || 500)
          .json({ message: err.response.data?.error || 'Extract failed', error: err.message });
      }
      return res.status(500).json({ message: 'Extract service unreachable', error: err.message });
    }
    const payload = ex.data?.data;
    if (!payload) return res.status(400).json({ message: ex.data?.error || 'No embedded data found' });
    return res.json({
      patient_id: payload.patient_id,
      patient_name: payload.patient_name,
      decrypted_message: payload.message || payload,
      payload,
      cipher_text: ex.data?.cipher_text
    });
  } catch (e) {
    return res.status(400).json({ message: 'Failed to extract from media', error: e.message });
  }
});

// File endpoints for download/view
router.get('/:id/file', authMiddleware, async (req, res) => {
  try {
    const msg = await Message.findById(req.params.id).lean();
    if (!msg) return res.status(404).json({ message: 'Not found' });
    const recipientKey = (req.user.email || req.user.sub);
    const allowed = (msg.recipient === recipientKey) || (msg.sender === req.user.sub) || req.user.role === 'admin';
    if (!allowed) return res.status(403).json({ message: 'Forbidden' });

    if (msg.file_url) return res.redirect(msg.file_url);

    const pf = msg.packagedFile || {};
    if (pf.stego?.b64) {
      const buf = Buffer.from(pf.stego.b64, 'base64');
      res.setHeader('Content-Type', pf.stego.mime || 'application/octet-stream');
      res.setHeader('Content-Disposition', `inline; filename="${pf.stego.filename || 'stego'}"`);
      return res.send(buf);
    }
    if (!pf.b64) return res.status(404).json({ message: 'No file' });
    const buf = Buffer.from(pf.b64, 'base64');
    res.setHeader('Content-Type', pf.mime || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${pf.filename || 'message.enc'}"`);
    return res.send(buf);
  } catch (e) {
    return res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id/file/stego', authMiddleware, async (req, res) => {
  try {
    const msg = await Message.findById(req.params.id).lean();
    if (!msg) return res.status(404).json({ message: 'Not found' });
    const recipientKey = (req.user.email || req.user.sub);
    const allowed = (msg.recipient === recipientKey) || (msg.sender === req.user.sub) || req.user.role === 'admin';
    if (!allowed) return res.status(403).json({ message: 'Forbidden' });
    if (msg.file_url) return res.redirect(msg.file_url);
    const stego = msg.packagedFile?.stego;
    if (!stego?.b64) return res.status(404).json({ message: 'No stego file' });
    const buf = Buffer.from(stego.b64, 'base64');
    res.setHeader('Content-Type', stego.mime || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${stego.filename || 'stego'}"`);
    return res.send(buf);
  } catch (e) {
    return res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id/file/original', authMiddleware, async (req, res) => {
  try {
    const msg = await Message.findById(req.params.id).lean();
    if (!msg) return res.status(404).json({ message: 'Not found' });
    const recipientKey = (req.user.email || req.user.sub);
    const allowed = (msg.recipient === recipientKey) || (msg.sender === req.user.sub) || req.user.role === 'admin';
    if (!allowed) return res.status(403).json({ message: 'Forbidden' });
    if (msg.original_file_url) return res.redirect(msg.original_file_url);
    const orig = msg.packagedFile?.original;
    if (!orig?.b64) return res.status(404).json({ message: 'No original file' });
    const buf = Buffer.from(orig.b64, 'base64');
    res.setHeader('Content-Type', orig.mime || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${orig.filename || 'original'}"`);
    return res.send(buf);
  } catch (e) {
    return res.status(500).json({ message: 'Server error' });
  }
});

export default router;
