import mongoose, { Schema } from 'mongoose';

const interviewSchema = new Schema({
  interviewer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  interviewee: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  fullCode: { type: String, required: true },
  snapshotImage: { type: String, required: true }, // base64 encoded image
  explanation: { type: String, required: true },
  questionForSnapshot: { type: String, default: '' },
  language: { type: String, required: true },
}, { timestamps: true });

export const Interview = mongoose.model('Interview', interviewSchema);
