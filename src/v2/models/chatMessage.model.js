import mongoose, { Schema } from "mongoose";

const envelopeSchema = new Schema(
  {
    iv: { type: String, required: true },
    salt: { type: String, required: true },
    data: { type: String, required: true },
  },
  { _id: false }
);

const chatMessageSchema = new Schema({
  sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  message: [{
    _id: { type: Schema.Types.ObjectId, auto: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User' }, // optional — legacy messages may not have this
    // Legacy plaintext messages (pre-E2EE) still use `text`. New E2EE
    // messages store ciphertexts only — the server never sees plaintext.
    text: { type: String },
    encrypted: { type: Boolean, default: false },
    ciphertexts: {
      // Encrypted to the sender's public key so the sender can read history.
      toSender: { type: envelopeSchema, default: null },
      // Encrypted to the receiver's public key so the receiver can read it.
      toReceiver: { type: envelopeSchema, default: null },
    },
    keyVersion: { type: Number, default: 1 },
    type: { type: String, enum: ['text', 'image', 'file'], default: 'text' },
    isRead: { type: Boolean, default: false },
    sentAt: { type: Date, default: Date.now },
  }]
});

export const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);