import mongoose, { Schema } from "mongoose";

const placementResultSchema = new Schema({
  placement_id: { type: Schema.Types.ObjectId, ref: "Placement", required: true },
  student_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
  result_status: { type: String, enum: ["passed", "failed"], required: true }
}, { timestamps: true });

placementResultSchema.pre("save", async function (next) {
  this.student_id = new Schema.Types.ObjectId(this.student_id);
  this.placement_id = new Schema.Types.ObjectId(this.placement_id);
  next()
})
export const PlacementResult = mongoose.model("PlacementResult", placementResultSchema);