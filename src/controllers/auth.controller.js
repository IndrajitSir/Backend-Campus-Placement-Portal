import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.models.js";
import { Student } from "../models/student.model.js";
import { options } from "../constants.js";
import { generateAccessAndRefreshTokens } from "../utils/generateToken.js";
import logger from "../utils/Logger/logger.js";
// curl -X POST http://localhost:6005/api/v1/auth/register -H "Content-Type:application/json" -d '{"name": "indra", "email": "indrajitmandal779@gmail.com", "password": 12345, "role": "student"}'
const register = asyncHandler(async (req, res) => {
    const { name, email, password, role } = req.body;
    if (!name) return res.status(400).json(new ApiError(400, "Name is required"))
    if (!email) return res.status(400).json(ApiError(400, "Email is required"))
    if (!password) return res.status(400).json(new ApiError(400, "Password is required"))
    if (!role) return res.status(400).json(new ApiError(400, "Role is required"))

    try {
        const existedUser = await User.findOne({
            $or: [{ name }, { email }]
        })
        if (existedUser) {
            logger.info(`A user trying to register himself with the name: ${name} and ${email} which already exists!!`);
            return res.status(409).json(new ApiError(409, "User already exists"));
        }
        const user = await User.create({ name, email, password, role });
        if (role === "student") {
            await Student.create({ student_id: user._id });
        }
        const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user);

        const createdUser = await User.findById(user._id).select(
            "-password -refreshToken"
        )
        if (!createdUser) {
            logger.info("Something went wrong while registering the new user!!")
            return res.status(500).json(new ApiError(500, "Something went wrong while registering the user"))
        }
        logger.info(`New user registered Successfully!! created ID: ${createdUser._id} and Name: ${createdUser.name}`)
        return res.status(201).cookie("accessToken", accessToken, options).cookie("refreshToken", refreshToken, options)
            .json(new ApiResponse(200, { user: createdUser, accessToken, refreshToken }, "User registered Successfully"))
    } catch (err) {
        logger.error(`Error while registering new user: ${err.message}`, { stack: err.stack });
        return res.status(500).json(new ApiError(500, `Server error`));
    }
});

const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email) return res.status(400).json(new ApiError(400, "Email is required"))
    if (!password) return res.status(400).json(new ApiError(400, "Password is required"))

    try {
        const user = await User.findOne({ email });
        if (!user) {
            logger.info(`A user trying to login himself with the name: ${email} which doesn't exists!!`);
            return res.status(404).json(new ApiError(404, "User does not exist or Invalid user credentials"));
        }

        const isPasswordValid = await user.isPasswordCorrect(password.toString());
        if (!isPasswordValid) {
            logger.info(`A user trying to login but the password is incorrect!!`);
            return res.status(401).json(new ApiError(401, "Invalid user credentials"))
        }
        console.log("password is valid");

        const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user);

        const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
        logger.info(`A user logged in Successfully!! ID: ${loggedInUser._id} and Name: ${loggedInUser.name}`)
        return res.status(200).cookie("accessToken", accessToken, options).cookie("refreshToken", refreshToken, options)
            .json(new ApiResponse(200, { user: loggedInUser, accessToken, refreshToken }, "User logged In Successfully"))
    } catch (err) {
        logger.error(`Error in login: ${err.message}`, { stack: err.stack });
        return res.status(500).json(new ApiError(500, `Server error`));
    }
});

const registerAdmin = asyncHandler(async (req, res) => {
    const { name, email, password, phone } = req.body;
    if (!name) return res.status(400).json(new ApiError(400, "Name is required"));
    if (!email) return res.status(400).json(new ApiError(400, "Email is required"));
    if (!password) return res.status(400).json(new ApiError(400, "Password is required"));
    if (!phone) return res.status(400).json(new ApiError(400, "Role is required"));

    try {
        const existingAdmin = await User.findOne({ role: "super_admin" });
        const isSuperAdmin = existingAdmin ? true : false;
        const isEmailExists = await User.findOne({ email });
        if (isEmailExists) {
            logger.info(`A new Admin cannot be created because email already exists!`);
            return res.status(400).json(new ApiError(400, "Email already exists!"));
        }
        const newAdmin = await User.create({
            name,
            email,
            phoneNumber: phone,
            password,
            role: isSuperAdmin ? "admin" : "super_admin"
        });

        const createdAdmin = await User.findById(newAdmin._id).select("-password -refreshToken");
        if (!createdAdmin) {
            logger.info("Something went wrong while registering new admin!!");
            return res.status(500).json(new ApiError(500, "Something went wrong while registering the user"))
        }
        logger.info("A new admin created Successfully!");
        return res.status(201).json(new ApiResponse(201, { createdAdmin }, "Admin created Successfully"))
    } catch (err) {
        logger.error(`Error while registering new admin: ${err.message}`, { stack: err.stack });
        return res.status(500).json(new ApiError(500, `Server error`));
    }
});

export { login, register, registerAdmin }
