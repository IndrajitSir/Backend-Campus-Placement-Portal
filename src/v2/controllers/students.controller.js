import { asyncHandler } from "../../utils/asyncHandler.js";
import { User } from "../../models/user.models.js";
import { Student } from "../../models/student.model.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import logger from "../../utils/Logger/logger.js";

const getAllStudents = asyncHandler(async (req, res) => {
    const page = parseInt(req.query?.page) || 1;
    const limit = parseInt(req.query?.limit) || 10;
    const skip = (page - 1) * limit;
    if (page < 1 || limit > 100) {
        logger.info("Page value or limit value is not set properly! in getAllStudents v2")
        return res.status(404).json(new ApiError(404, "Page value or limit value is not set properly!"));
    }
    const total = await Student.countDocuments();
    const students = await Student.find().skip(skip).limit(limit).populate("student_id").select("-password -refreshToken");

    return res.status(200).json(new ApiResponse(200,
        {
            students: students,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
        }, `Successfully fetched data of students!`
    ));
});

export { getAllStudents, getPublicStudentProfile }

const isUrl = (value) => {
    if (!value || typeof value !== "string") return false;
    try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:";
    } catch {
        return false;
    }
};

// Public (any logged-in user) student profile: safe fields only.
const getPublicStudentProfile = asyncHandler(async (req, res) => {
    const { studentId } = req.params;

    const user = await User.findById(studentId).select("name email role");
    if (!user) {
        throw new ApiError(404, "Student not found");
    }

    const student = await Student.findOne({ student_id: user._id });
    if (!student) {
        throw new ApiError(404, "Student not found");
    }

    const resumeUrl = isUrl(student.resume) ? student.resume : null;

    // Profile completeness: each of the 7 signals carries equal weight.
    const signals = [
        Boolean(student.department),
        Boolean(student.location),
        Boolean(student.about),
        Boolean(student.professional_skill),
        Boolean(resumeUrl),
        Array.isArray(student.projects) && student.projects.length > 0,
        student.cgpa !== null && student.cgpa !== undefined && student.cgpa !== "",
    ];
    const filled = signals.filter(Boolean).length;
    const completeness = Math.round((filled / signals.length) * 100);

    return res.status(200).json(
        new ApiResponse(200, {
            student: {
                name: user.name,
                avatar: student.avatar || "",
                email: user.email,
                role: user.role,
                department: student.department,
                professional_skill: student.professional_skill,
                about: student.about,
                location: student.location,
                cgpa: student.cgpa,
                projects: student.projects,
                resume: resumeUrl,
                approved: Boolean(student.approved),
                completeness,
            },
        }, "Student public profile fetched")
    );
});

export { getAllStudents, getPublicStudentProfile }