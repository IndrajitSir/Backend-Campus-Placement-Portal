import mongoose, { Schema } from "mongoose";

const placementSchema = new Schema({
    company_name: { type: String, required: true },
    job_title: { type: String, required: true },
    description: { type: String },
    eligibility: { type: String },
    location: { type: String },
    last_date: { type: Date, required: true },
    created_by: { type: Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });

placementSchema.pre("save", async function (next) {
  this.created_by = new Schema.Types.ObjectId(this.created_by);
  next()
})
export const Placement = mongoose.model("Placement", placementSchema);