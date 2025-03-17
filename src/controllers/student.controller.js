import { Student } from "../models/student.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";

const uploadResume = asyncHandler(async (req, res) => {
    const resumeLocalPath = req.files?.resume[0]?.path;

    if (!resumeLocalPath) return res.status(401).json(new ApiError(401, "Resume is missing!"));

    const uploadedResume = await uploadOnCloudinary(resumeLocalPath);

    const student = await Student.create({
        student_id: req.user._id,
        resume: uploadedResume.url
    });

    const response = await Student.findById(student._id);
    if (!response) {
        return res.status(500).json(new ApiError(500, "Something went wrong while uploading the resume!"))
    }
    return res.status(201)
        .json(new ApiResponse(201, response, "Resume uploaded successfully!"))
});

const updateResume = asyncHandler(async (req, res) => {
    const newResumeLocalPath = req.files?.newResume[0]?.path;

    if (!newResumeLocalPath) return res.status(401).json(new ApiError(401, "Resume is missing!"));

    const student = await Student.find({ student_id: req.user._id });

    if (!student) return res.status(404).json(new ApiError(404, "Student not found!"));

    await deleteFromCloudinary(student.resume);
    const uploadedNewResume = await uploadOnCloudinary(newResumeLocalPath);

    const response = await Student.findOneAndUpdate({ student_id: req.user._id }, { $set: { resume: uploadedNewResume.url } }, { returnNewDocument: true });

    if (!response) {
        return res.status(500).json(new ApiError(500, "Something went wrong while uploading the resume!"))
    }
    return res.status(201)
        .json(new ApiResponse(201, response, "Resume updated successfully!"))
});

const deleteResume = asyncHandler(async (req, res) => {
    const student = await Student.find({ student_id: req.user._id });

    if (!student) return res.status(404).json(new ApiError(404, "Student not found!"));

    await deleteFromCloudinary(student.resume);

    const response = await Student.findOneAndDelete({ student_id: req.user._id }, { $set: { resume: null } }, { returnNewDocument: true });

    if (!response) {
        return res.status(500).json(new ApiError(500, "Something went wrong while uploading the resume!"))
    }
    return res.status(201)
        .json(new ApiResponse(201, response, "Resume updated successfully!"))
});

const getAllStudents = asyncHandler(async (req, res) => {
    try {
        const students = await Student.find();
        res.status(200)
            .json(new ApiResponse(200, students, ""));
    } catch (err) {
        return res.status(500).json(new ApiError(500, "Server error"));
    }
});

const getOneStudent = asyncHandler(async (req, res) => {
    const { nameOremail } = req.body;
    if (!nameOremail) {
        return res.status(400).json(new ApiError(400, "value is missing"))
    }
    const existedStudent = await User.findOne({
        $or: [{ name: nameOremail }, { email: nameOremail }]
    })
    if (!existedUser) return res.status(409).json(new ApiError(409, "Student does not exists"));
    const student = await Student.findOne({ student_id: existedStudent._id }).populate("student_id").select("-password -refreshToken");
    return res.status(201).json(new ApiResponse(200, student, ""));
});
export { uploadResume, updateResume, deleteResume, getAllStudents, getOneStudent }