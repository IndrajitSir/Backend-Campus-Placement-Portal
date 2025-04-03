import {mongoose, Schema} from "mongoose";

const applicationSchema = new Schema({
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    placement_id: { type: Schema.Types.ObjectId, ref: "Placement", required: true },
    status: { type: String, enum: ["applied", "shortlisted", "selected", "rejected"], default: "" }
  }, { timestamps: true });

export const Application = mongoose.model("Application", applicationSchema);