import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  username: { type: String, required: true },
  action: { type: String, required: true },
  patient_id: { type: String },
  details: { type: Object },
  ip: { type: String },
  userAgent: { type: String },
  success: { type: Boolean, default: true }
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

export default mongoose.model('AuditLog', auditLogSchema, 'audit_logs');
