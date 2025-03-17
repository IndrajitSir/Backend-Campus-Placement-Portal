import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import User from "../models/user.models.js";
import Student from "../models/student.model.js";
const updateApproval = asyncHandler(async (req, res) => { // will be approved by admin
    try {
        const { studentDetails } = req.body;
        if (!studentDetails) {
            return res.status(400).json(new ApiError(400, "Student Details is Required"))
        }
        const isStudent = await User.findById(studentDetails._id);
        if (!isStudent) {
            res.status(404).json(new ApiError(404, "Student is not registered!"));
        }
        const student = await Student.findById(isStudent._id);
        const updatedStudent = await Student.findOneAndUpdate({ student_id: student._id }, {
            $set: {
                approved: !student.approved
            }
        }, { new: true }).populate("student_id").select("-password");
        return res
            .status(200)
            .json(new ApiResponse(200, updatedStudent, "Approval changed successfully"))
    } catch (err) {
        return res.status(400).json(new ApiError(500, "Server error"));
    }
});

const createNewStudent = asyncHandler(async (req, res) => {
    const { name, email, password, phone = "" } = req.body;
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
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(student);

    const createdStudent = await User.findById(student._id).select(
        "-password -refreshToken"
    )
    if (!createdStudent) {
        return res.status(500).json(new ApiError(500, "Something went wrong while registering the user"))
    }

    return res
        .status(201)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: createdStudent, accessToken, refreshToken
                },
                "Student registered Successfully"
            )
        )
});
export { updateApproval, createNewStudent }