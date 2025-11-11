import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderUsername: { type: String, required: true },
  recipient: { type: String, required: true },
  patient_id: { type: String, required: true },
  patient_name: { type: String, required: true },
  data_summary: { type: String },
  file_url: { type: String },
  cipher_text: { type: String, required: true },
  decrypted: { type: Boolean, default: false },
  decrypted_at: { type: Date },
  notes: { type: String }
}, { timestamps: true });

export default mongoose.model('Message', messageSchema, 'messages');
