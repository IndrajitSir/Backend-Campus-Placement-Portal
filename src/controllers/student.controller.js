import { Student } from "../models/student.model";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary";

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

    if(!student) return res.status(404).json(new ApiError(404, "Student not found!"));

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
    
    if(!student) return res.status(404).json(new ApiError(404, "Student not found!"));
    
    await deleteFromCloudinary(student.resume);

    const response = await Student.findOneAndDelete({ student_id: req.user._id }, { $set: { resume: null } }, { returnNewDocument: true });

    if (!response) {
        return res.status(500).json(new ApiError(500, "Something went wrong while uploading the resume!"))
    }
    return res.status(201)
        .json(new ApiResponse(201, response, "Resume updated successfully!"))
});
export { uploadResume, updateResume, deleteResume }