import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { Student } from "../models/student.model.js";

const createNewStudent = asyncHandler(async (req, res) => {
    const { name, email, password, phone } = req.body;
    if (!name) {
        return res.status(400).json(new ApiError(400, "Name is required"))
    }
    if (!email) {
        return res.status(400).json(ApiError(400, "Email is required"))
    }
    if (!password) {
        return res.status(400).json(new ApiError(400, "Password is required"))
    }
    const existedStudent = await User.findOne({
        $or: [{ name }, { email }]
    })
    if (existedStudent) return res.status(409).json(new ApiError(409, "Student already exists"));

    const student = await User.create({ name, email, password, role: "student", phoneNumber: phone });
    await Student.create({ student_id: student._id });

    const createdStudent = await User.findById(student._id).select(
        "-password -refreshToken"
    )
    if (!createdStudent) {
        return res.status(500).json(new ApiError(500, "Something went wrong while registering new student!"))
    }

    return res.status(201).json(new ApiResponse(200, { createdStudent }, "Student registered Successfully"))
});

const createNewStaff = (role) => asyncHandler(async (req, res) => {
    const { name, email, password, phone } = req.body;
    if (!name) {
        return res.status(400).json(new ApiError(400, "Name is required"))
    }
    if (!email) {
        return res.status(400).json(ApiError(400, "Email is required"))
    }
    if (!password) {
        return res.status(400).json(new ApiError(400, "Password is required"))
    }
    const existedStaff = await User.findOne({
        $or: [{ name }, { email }]
    })
    if (existedStaff) return res.status(409).json(new ApiError(409, "Staff already exists"));

    const newStaff = await User.create({ name, email, password, role: role, phoneNumber: phone });

    const createdStaff = await User.findById(newStaff._id).select(
        "-password -refreshToken"
    )
    if (!createdStaff) {
        return res.status(500).json(new ApiError(500, "Something went wrong while registering new Staff!"))
    }

    return res.status(201).json(new ApiResponse(200, { createdStaff }, "Staff registered Successfully"))
});

export { createNewStudent, createNewStaff }