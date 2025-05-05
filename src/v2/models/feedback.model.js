import mongoose, { Schema } from "mongoose";

const feedbackSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  feedbackText: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5 },
  submittedAt: { type: Date, default: Date.now },
});

export const Feedback = mongoose.model('Feedback', feedbackSchema);