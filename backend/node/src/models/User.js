import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true, index: true, trim: true, lowercase: true },
  email: { type: String, unique: true, required: true, index: true, trim: true, lowercase: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['doctor', 'admin'], default: 'doctor' }
}, { timestamps: true });

// Ensure case-insensitive uniqueness
userSchema.index({ username: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });
userSchema.index({ email: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });

export default mongoose.model('User', userSchema, 'users');
