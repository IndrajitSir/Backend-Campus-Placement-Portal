import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.models.js";
import { options } from "../constants.js";
// curl -X POST http://localhost:6005/api/v1/auth/register -H "Content-Type:application/json" -d '{"name": "indra", "email": "indrajitmandal779@gmail.com", "password": 12345, "role": "student"}'
const register = asyncHandler(async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        if (!name) {
            return res.status(400).json(new ApiError(400, "Name is required"))
        }
        if (!email) {
            return res.status(400).json(ApiError(400, "Email is required"))
        }
        if (!password) {
            return res.status(400).json(new ApiError(400, "Password is required"))
        }
        if (!role) {
            return res.status(400).json(new ApiError(400, "Role is required"))
        }
        const existedUser = await User.findOne({
            $or: [{ username }, { email }]
        })
        if (existedUser) return res.status(409).json(new ApiError(409, "User already exists"));

        const user = await User.create({ name, email, password, role });
        const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user);

        const createdUser = await User.findById(user._id).select(
            "-password -refreshToken"
        )
        if (!createdUser) {
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
                        user: loggedInUser, accessToken, refreshToken
                    },
                    "User registered Successfully"
                )
            )
    } catch (err) {
        return res.status(500).json(new ApiError(500, `${err}`));
    }
});

const login = asyncHandler(async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email) {
            return res.status(400).json(new ApiError(400, "Email is required"))
        }
        if (!password) {
            return res.status(400).json(new ApiError(400, "Password is required"))
        }
        console.log(`Email : ${email} and Password : ${password}`);

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json(new ApiError(404, "User does not exist or Invalid user credentials"));
        }

        const isPasswordValid = await User.isPasswordCorrect(password);
        if (!isPasswordValid) return res.status(401).json(new ApiError(401, "Invalid user credentials"))

        const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user);

        const loggedInUser = await User.findById(user._id).select("-password -refreshToken") // here again, do this instead, const loggedInUser = user.select("-password -refreshToken");

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    {
                        user: loggedInUser, accessToken, refreshToken
                    },
                    "User logged In Successfully"
                )
            )
    } catch (err) {
        return res.status(500).json(new ApiError(500, "Server error"));
    }
});

const registerAdmin = asyncHandler(async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;
        if (!name) {
            return res.status(400).json(new ApiError(400, "Name is required")); 
        }
        if (!email) {
            return res.status(400).json(new ApiError(400, "Email is required"));
        }
        if (!password) {
            return res.status(400).json(new ApiError(400, "Password is required"));
        }
        if (!phone) {
            return res.status(400).json(new ApiError(400, "Role is required"));
        }
        const existingAdmin = await User.findOne({ role: "super_admin" });
        const isSuperAdmin = false;
        if (!existingAdmin) {
            existingAdmin = await User.findOne({ role: "admin" });
            isSuperAdmin = existingAdmin ? false : true;
        }
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json(new ApiError(400, "Admin already exists!"));
        }
        const newAdmin = await User.create({
            name,
            email,
            phone,
            password,
            role: isSuperAdmin ? "super_admin" : "admin"
        });
        const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(newAdmin);

        const createdAdmin = await User.findById(newAdmin._id).select(
            "-password -refreshToken"
        )
        if (!createdAdmin) {
            return res.status(500).json(new ApiError(500, "Something went wrong while registering the user"))
        }

        return res
            .status(201)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(
                new ApiResponse(
                    201,
                    {
                        user: createdAdmin, accessToken, refreshToken
                    },
                    "User registered Successfully"
                )
            )
    } catch (error) {

    }
})

export { login, register, registerAdmin }