import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { Student } from "../models/student.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import logger from "../utils/Logger/logger.js";

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
    try {
        const existedStudent = await User.findOne({
            $or: [{ name }, { email }]
        })
        if (existedStudent) {
            logger.info(`Student with ${name} or ${email} is already present in the database!`);
            return res.status(409).json(new ApiError(409, "Student already exists"));
        }

        const student = await User.create({ name, email, password, role: "student", phoneNumber: phone });
        await Student.create({ student_id: student._id });

        const createdStudent = await User.findById(student._id).select(
            "-password -refreshToken"
        )
        if (!createdStudent) {
            logger.info(`Something went wrong while registering new student!`);
            return res.status(500).json(new ApiError(500, "Something went wrong while registering new student!"))
        }
        logger.info(`New student created successfully ! userID: ${createdStudent._id}, Name: ${createdStudent.name}`)
        return res.status(201).json(new ApiResponse(200, { createdStudent }, "Student registered Successfully"))
    } catch (error) {
        logger.error(`Error in Create new student: ${error.message}`, { stack: error.stack });
        return res.status(500).json(new ApiError(500, `Server error`));
    }
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
    try {
        const existedStaff = await User.findOne({
            $or: [{ name }, { email }]
        })
        if (existedStaff) {
            logger.info(`Staff with ${name} or ${email} is already present in the database!`);
            return res.status(409).json(new ApiError(409, "Staff already exists"));
        }

        const newStaff = await User.create({ name, email, password, role: role, phoneNumber: phone });

        const createdStaff = await User.findById(newStaff._id).select(
            "-password -refreshToken"
        )
        if (!createdStaff) {
            logger.info(`Something went wrong while registering new staff!`);
            return res.status(500).json(new ApiError(500, "Something went wrong while registering new Staff!"))
        }
        logger.info(`New staff created successfully ! userID: ${createdStaff._id}, Name: ${createdStaff.name}`)
        return res.status(201).json(new ApiResponse(200, { createdStaff }, "Staff registered Successfully"))
    } catch (error) {
        logger.error(`Error in Create new staff: ${error.message}`, { stack: error.stack });
        return res.status(500).json(new ApiError(500, `Server error`));
    }
});

const deleteUser = asyncHandler(async (req, res) => {
    try {
        const { userID } = req.body;
        if (!userID) return res.status(400).json(new ApiError(400, "UserID is required"))

        const user = await User.findById(userID);
        if (!user) {
            logger.info(`Staff with ${userID} doesn't exists!`);
            return res.status(404).json(new ApiError(404, "User doesn't exists"));
        }
        await User.findByIdAndDelete(userID);
        logger.info(`User with ID: ${user._id} and Name: ${user.name} got deleted successfully!`)
        return res.status(200).json(new ApiResponse(200, {}, "User deleted successfully!"));
    } catch (err) {
        logger.error(`Error in Delete user: ${err.message}`, { stack: err.stack });
        return res.status(500).json(new ApiError(500, `Server error`));
    }
})
export { createNewStudent, createNewStaff, deleteUser }