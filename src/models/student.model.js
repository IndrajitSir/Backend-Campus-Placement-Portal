import { mongoose, Schema } from "mongoose";

const studentSchema = new Schema(
    {
        student_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
        resume: { type: String },
        approved: { type: Boolean, default: false },
    }, { timestamps: true }
);

export const Student = mongoose.model("Student", studentSchema);