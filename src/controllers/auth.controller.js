import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.models.js";
import { Student } from "../models/student.model.js";
import { options } from "../constants.js";
import { generateAccessAndRefreshTokens } from "../utils/generateToken.js";
import logger from "../utils/Logger/logger.js";

const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  const existedUser = await User.findOne({ email });
  if (existedUser) {
    logger.info(`Registration blocked — email already exists: ${email}`);
    throw new ApiError(409, "User already exists");
  }

  logger.info("Creating new user...");
  const user = await User.create({ name, email, password, role });

  // Students get a linked Student profile on registration
  if (role === "student") {
    await Student.create({ student_id: user._id });
  }

  logger.info("Generating tokens...");
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user);

  const createdUser = await User.findById(user._id).select("-password -refreshToken");
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  logger.info(`New user registered successfully — id: ${createdUser._id}, name: ${createdUser.name}`);
  return res
    .status(201)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(201, { user: createdUser, accessToken, refreshToken }, "User registered successfully"));
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    logger.info(`Login blocked — no user found for email: ${email}`);
    throw new ApiError(401, "Invalid user credentials");
  }

  const isPasswordValid = await user.isPasswordCorrect(String(password));
  if (!isPasswordValid) {
    logger.info(`Login blocked — incorrect password for email: ${email}`);
    throw new ApiError(401, "Invalid user credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user);

  const loggedInUser = await User.findById(user._id).select("-password -refreshToken");
  logger.info(`User logged in successfully — id: ${loggedInUser._id}, name: ${loggedInUser.name}`);

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(200, { user: loggedInUser, accessToken, refreshToken }, "User logged in successfully"));
});

const registerAdmin = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  const emailExists = await User.findOne({ email });
  if (emailExists) {
    logger.info(`Admin creation blocked — email already exists: ${email}`);
    throw new ApiError(409, "Email already exists");
  }

  const existingSuperAdmin = await User.findOne({ role: "super_admin" });
  const newAdmin = await User.create({
    name,
    email,
    password,
    phoneNumber: phone,
    role: existingSuperAdmin ? "admin" : "super_admin",
  });

  const createdAdmin = await User.findById(newAdmin._id).select("-password -refreshToken");
  if (!createdAdmin) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  logger.info(`Admin created successfully — id: ${createdAdmin._id}`);
  return res.status(201).json(new ApiResponse(201, { createdAdmin }, "Admin created successfully"));
});

export { login, register, registerAdmin };
