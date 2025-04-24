import mongoose from 'mongoose';

const interviewSchema = new mongoose.Schema({
  fullCode: { type: String, required: true },
  language: { type: String, required: true },
  snapshot: { type: String, required: true }, // base64 image
  questionForSnapshot: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

export const Interview = mongoose.model('Interview', interviewSchema);
