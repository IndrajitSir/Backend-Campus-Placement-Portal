import mongoose, { Schema } from "mongoose";

const chatMessageSchema = new Schema({
  roomId: { type: String, required: true },
  senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  messageType: { type: String, enum: ['text', 'image', 'file'], default: 'text' },
  isRead: { type: Boolean, default: false },
  sentAt: { type: Date, default: Date.now },
});

export const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);