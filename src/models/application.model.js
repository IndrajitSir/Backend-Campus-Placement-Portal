import mongoose, { Schema } from "mongoose";

const applicationSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
  placement_id: { type: Schema.Types.ObjectId, ref: "Placement", required: true },
  status: { type: String, enum: ["applied", "shortlisted", "selected", "rejected"], default: "" }
}, { timestamps: true });

applicationSchema.pre("save", async function (next) {
  if (typeof this.user_id === "string"){
    this.user_id = new Schema.Types.ObjectId(this.user_id);
  }
  if (typeof this.placement_id === "string"){
    this.placement_id = new Schema.Types.ObjectId(this.placement_id);
  }
  next()
})
export const Application = mongoose.model("Application", applicationSchema);