import mongoose, { Schema } from "mongoose";

const chatMessageSchema = new Schema({
  sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  message: [{
    _id: { type: Schema.Types.ObjectId, auto: true },
    text: { type: String, required: true },
    type: { type: String, enum: ['text', 'image', 'file'], default: 'text' },
    isRead: { type: Boolean, default: false },
    sentAt: { type: Date, default: Date.now },
  }]
});

export const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);