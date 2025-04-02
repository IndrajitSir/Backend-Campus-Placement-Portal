import { mongoose, Schema } from "mongoose";

const studentSchema = new Schema(
    {
        student_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
        resume: { type: String },
        approved: { type: Boolean, default: false },
        location: { type: String, default: "" },
        about: { type: String, default: "" },
        professional_skill: { type: String, default: "" },
        department: { type: String, default: "" },
    }, { timestamps: true }
);

export const Student = mongoose.model("Student", studentSchema);