import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  sender: { type: String, required: true },
  recipient: { type: String, required: true, index: true },
  patient_id: { type: String, required: true },
  patient_name: { type: String, required: true },
  file_url: { type: String, required: true },
  cipher_text: { type: String, required: true },
  decrypted: { type: Boolean, default: false },
  decrypted_at: { type: Date }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

export default mongoose.model('Message', messageSchema, 'messages');
