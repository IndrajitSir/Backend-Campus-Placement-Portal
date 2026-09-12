import mongoose, { Schema } from "mongoose";

const bookmarkSchema = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    placement_id: { type: Schema.Types.ObjectId, ref: "Placement", required: true },
  },
  { timestamps: true }
);

bookmarkSchema.index({ user_id: 1, placement_id: 1 }, { unique: true });

export const Bookmark = mongoose.model("Bookmark", bookmarkSchema);
