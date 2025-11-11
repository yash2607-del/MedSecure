import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User.js';
import Message from '../src/models/Message.js';
import AuditLog from '../src/models/AuditLog.js';

async function run() {
  dotenv.config({ path: process.env.ENV_PATH || '.env' });
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URI missing');
    process.exit(1);
  }
  await mongoose.connect(uri, { dbName: process.env.MONGO_DB || 'MedSecure' });
  console.log('Connected');

  // Ensure collections exist by creating minimal docs then deleting (Mongo creates lazily)
  const tempUser = await User.create({ username: '__init__', passwordHash: 'x', role: 'doctor' });
  const tempMsg = await Message.create({ sender: tempUser._id, senderUsername: '__init__', recipient: '__init__', patient_id: 'temp', patient_name: 'temp', cipher_text: 'temp' });
  const tempAudit = await AuditLog.create({ username: '__init__', action: 'init' });

  await User.deleteOne({ _id: tempUser._id });
  await Message.deleteOne({ _id: tempMsg._id });
  await AuditLog.deleteOne({ _id: tempAudit._id });

  // Index recommendations
  await User.collection.createIndex({ username: 1 }, { unique: true });
  await Message.collection.createIndex({ recipient: 1, createdAt: -1 });
  await Message.collection.createIndex({ patient_id: 1 });
  await AuditLog.collection.createIndex({ username: 1, created_at: -1 });

  console.log('Collections initialized with indexes.');
  await mongoose.disconnect();
}

run().catch(e => { console.error(e); process.exit(1); });
