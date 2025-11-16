import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import mongoose from 'mongoose';

import authRoutes from './routes/auth.js';
import messageRoutes from './routes/messages.js';
import auditRoutes from './routes/audit.js';
import debugRoutes from './routes/debug.js';

dotenv.config();

const app = express();

app.use(helmet());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

app.use(cors({
  origin: process.env.CLIENT_ORIGIN?.split(',') || ['http://localhost:5173'],
  credentials: true
}));

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('Missing MONGO_URI in env');
  process.exit(1);
}

await mongoose.connect(MONGO_URI, { dbName: process.env.MONGO_DB || 'medsecure' });

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/auth', authRoutes);
app.use('/messages', messageRoutes);
app.use('/audit', auditRoutes);
app.use('/debug', debugRoutes);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Node backend running on port ${PORT}`));
