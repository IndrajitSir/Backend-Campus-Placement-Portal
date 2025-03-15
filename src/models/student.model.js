import { mongoose, Schema } from "mongoose";

const studentSchema = new Schema(
    {
        student_id: {
            type: Schema.Types.ObjectId, ref: "User", required: true
        },
        resume: {
            type: String
        }
    },{ timestamps: true}
);

export const Students = mongoose.model("Students", studentSchema);