import { mongoose, Schema } from "mongoose";

const studentSchema = new Schema(
    {
        student_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
        resume: { type: String, default: "" },
        approved: { type: Boolean, default: false },
        location: { type: String, default: "" },
        about: { type: String, default: "" },
        professional_skill: { type: String, default: "" },
        department: { type: String, default: "" },
        projects: [{
            _id: {
                type: Schema.Types.ObjectId,
                auto: true
            },
            title: {
                type: String, required: true
            },
            description: {
                type: String, required: true
            },
            link: {
                type: String, required: true
            },
        }]
    }, { timestamps: true }
);

export const Student = mongoose.model("Student", studentSchema);