import {mongoose, Schema} from "mongoose";

const placementResultSchema = new Schema({
    placement_id: { type: Schema.Types.ObjectId, ref: "Placement", required: true },
    student_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    result_status: { type: String, enum: ["passed", "failed"], required: true }
  }, { timestamps: true });

export const PlacementResult = mongoose.model("PlacementResult", placementResultSchema);