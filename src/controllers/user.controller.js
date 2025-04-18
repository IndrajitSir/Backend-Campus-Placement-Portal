import { User } from "../models/user.models.js";
import { options } from "../constants.js";
import { generateAccessAndRefreshTokens } from "../utils/generateToken.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js"
import { Student } from "../models/student.model.js"
import logger from "../utils/Logger/logger.js";

const logoutUser = asyncHandler(async (req, res) => {
    try {
        console.log("User logged Out");
        await User.findByIdAndUpdate(req.user._id,
            {
                $unset: {
                    refreshToken: 1 // this removes the field from document
                }
            }, { new: true }
        )
        logger.info(`A user with the ID: ${req.user._id} looged out!`);
        return res.status(200).clearCookie("accessToken", options).clearCookie("refreshToken", options)
            .json(new ApiResponse(200, {}, "User logged Out"))
    }
    catch (err) {
        logger.error(`Error in logout : ${err.message}`, { stack: err.stack });
        return res.status(500).json(new ApiError(500, "Server error"));
    }
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        return res.status(401).json(new ApiError(401, "unauthorized request"))
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )

        const user = await User.findById(decodedToken?._id)

        if (!user) {
            logger.info(`User trying to get a new access token but the refresh token is invalid!`)
            return res.status(401).json(new ApiError(401, "Invalid refresh token"))
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            return res.status(401).json(new ApiError(401, "Refresh token is expired or used"))
        }
        const { accessToken, newRefreshToken } = await generateAccessAndRefreshTokens(user);

        return res.status(200).cookie("accessToken", accessToken, options).cookie("refreshToken", newRefreshToken, options)
            .json(new ApiResponse(200, { accessToken, refreshToken: newRefreshToken }, "Access token refreshed"))
    } catch (error) {
        logger.error(`Error in refresh access token : ${error.message}`, { stack: error.stack });
        return res.status(401).json(new ApiError(401, error?.message || "Invalid refresh token"))
    }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body
    if (!oldPassword || !newPassword) return res.status(400).json(new ApiError(400, "Both the passwords are required!"));
    try {
        const user = await User.findById(req.user?._id)
        const isPasswordCorrect = await user.isPasswordCorrect(oldPassword.toString())

        if (!isPasswordCorrect) {
            logger.info(`User trying to change the old password but the new password is incorrect!`);
            return res.status(400).json(new ApiError(400, "Invalid old password"))
        }

        user.password = newPassword
        await user.save({ validateBeforeSave: false })

        return res.status(200).json(new ApiResponse(200, {}, "Password changed successfully"))
    }
    catch (error) {
        logger.error(`Error in refresh access token : ${error.message}`, { stack: error.stack });
        return res.status(500).json(new ApiError(500, "Server error"));
    }
});

const updatePhoneNumber = asyncHandler(async (req, res) => {
    const { phone } = req.body;
    if (!phone) return res.status(400).json(new ApiError(400, "Phone number is missing!"))
    try {
        const user = await User.findById(req.user?._id)

        user.phoneNumber = phone
        await user.save({ validateBeforeSave: false })

        return res.status(200).json(new ApiResponse(200, {}, "Phone number changed successfully"))
    }
    catch (error) {
        logger.error(`Error in refresh access token : ${error.message}`, { stack: error.stack });
        return res.status(500).json(new ApiError(500, "Server error"));
    }
});

const getCurrentUser = asyncHandler(async (req, res) => {
    try {
        console.log("returning current user");
        if (req.user.role === "student") {
            const student = await Student.findOne({ student_id: req.user._id });
            return res.status(200).json(new ApiResponse(200,
                { user: req.user, accessToken: req.cookies.accessToken, refreshToken: req.cookies.refreshToken, student: student },
                "User fetched successfully"));
        }
        return res.status(200).json(new ApiResponse(200,
            { user: req.user, accessToken: req.cookies.accessToken, refreshToken: req.cookies.refreshToken },
            "User fetched successfully"));
    } catch (error) {
        logger.error(`Error while fetching current user : ${error.message}`, { stack: error.stack });
        return res.status(500).json(new ApiError(500, "Server error"));
    }
});

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { name, email, phone } = req.body

    if (!name || !email || !phone) {
        return res.status(400).json(new ApiError(400, "All fields are required"))
    }
    try {
        const user = await User.findByIdAndUpdate(req.user?._id,
            {
                $set: {
                    name,
                    email: email,
                    phoneNumber: phone
                }
            }, { new: true }

        ).select("-password")
        if (!user) {
            logger.info(`Error occured while updating user account details for this userID: ${req?.user._id}`);
            return res.status(400).json(new ApiError(400, "Error occured while updating user account details"));
        }

        return res.status(200).json(new ApiResponse(200, user, "Account details updated successfully"))
    }
    catch (error) {
        logger.error(`Error in update account details : ${error.message}`, { stack: error.stack });
        return res.status(500).json(new ApiError(500, "Server error"));
    }
});

const changeCurrentName = asyncHandler(async (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json(new ApiError(400, "Name is required"))
    try {
        const user = await User.findByIdAndUpdate(req.user._id, {
            $set: {
                name: name
            }
        }, { new: true }).select("-password");
        if (!user) {
            logger.info(`Error occured while updating user current name for this userID: ${req?.user._id}`);
            return res.status(400).json(new ApiError(400, "Error occured while updating user current name!"));
        }
        return res.status(200).json(new ApiResponse(200, user, "Name updated successfully"))
    } catch (error) {
        logger.error(`Error in update user's current name : ${error.message}`, { stack: error.stack });
        return res.status(500).json(new ApiError(500, "Server error"));
    }
});

const changeCurrentEmail = asyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json(new ApiError(400, "Email is required"))
    try {
        const user = await User.findByIdAndUpdate(req.user._id, {
            $set: {
                email: email
            }
        }, { new: true }).select("-password");
        if (!user) {
            logger.info(`Error occured while updating user current email for this userID: ${req?.user._id}`);
            return res.status(400).json(new ApiError(400, "Error occured while updating user's current email!"));
        }
        return res.status(200).json(new ApiResponse(200, user, "Email updated successfully"))
    } catch (error) {
        logger.error(`Error in update user's current email : ${error.message}`, { stack: error.stack });
        return res.status(500).json(new ApiError(500, "Server error"));
    }
});

const getAllPlacementStaffs = asyncHandler(async (req, res) => {
    try {
        const placementStaffs = await User.find({ role: "placement_staff" });
        if (!Array.isArray(placementStaffs) && !placementStaffs.length > 0) {
            logger.info(`There is no placement staff in the database!`);
            return res.status(204).json(new ApiResponse(204, {}, "No placement staff in the database"))
        }
        return res.status(200).json(new ApiResponse(200, placementStaffs, "Placement Staffs fetched successfully"))
    } catch (error) {
        logger.error(`Error in get all placement staffs : ${error.message}`, { stack: error.stack });
        return res.status(500).json(new ApiError(500, "Server error"));
    }
});

const getAllAdmins = asyncHandler(async (req, res) => {
    try {
        const admins = await User.find({ role: "admin" });
        if (!Array.isArray(admins) && !admins.length > 0) {
            logger.info(`There is no admins in the database!`);
            return res.status(204).json(new ApiResponse(204, {}, "No admins in the database"))
        }
        return res.status(200).json(new ApiResponse(200, admins, "Admins fetched successfully"))
    } catch (error) {
        logger.error(`Error in get all admins: ${error.message}`, { stack: error.stack });
        return res.status(500).json(new ApiError(500, "Server error"));
    }
});

const getNonSuperAdminUsers = asyncHandler(async (req, res)=>{
    try {
        const users = await User.find({
            role: { $ne: "super_admin"}
        }, "name email");
        if (!Array.isArray(users) && !users.length > 0) {
            logger.info(`There is no users in the database!`);
            return res.status(204).json(new ApiResponse(204, {}, "No users in the database"))
        }
        return res.status(200).json(new ApiResponse(200, users, "Fetched users(name, email) successfully"))
    } catch (error) {
        logger.error(`Error in get Non-Super Admin Users: ${error.message}`, { stack: error.stack });
        return res.status(500).json(new ApiError(500, "Server error"));
    }
});

const getOneUser = asyncHandler(async (req, res) => {
    const nameOremail = req.params.nameOremail;
    console.log(`params: ${req.params}`)
    console.log(`name or email : ${nameOremail}`);
    if (!nameOremail) return res.status(400).json(new ApiError(400, "value is missing"))
    try {
        const existedUser = await User.findOne({ $or: [{ name: nameOremail }, { email: nameOremail }] })
        if (!existedUser) {
            logger.info(`User with ${nameOremail} does not exists in the database!`)
            return res.status(409).json(new ApiError(409, "User does not exists"));
        }
        console.log(`Existed user: ${existedUser}`);
        if(existedUser.role !== "student"){
            logger.info(`Sending one user data in response! having Email or Name: ${nameOremail}`);
            return res.status(200).json(new ApiResponse(200, existedUser, "User fetched successfully!"));
        }
        const student = await Student.findOne({ student_id: existedUser._id }).populate("student_id").select("-password -refreshToken");
        logger.info(`Sending one user data in response! having Email or Name: ${nameOremail}`);
        return res.status(200).json(new ApiResponse(200, student, ""));
    } catch (error) {
        logger.error(`Error in get one user : ${error.message}`, { stack: error.stack });
        return res.status(500).json(new ApiError(500, `Server error`));
    }
});

export {
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    changeCurrentName,
    changeCurrentEmail,
    updatePhoneNumber,
    getAllPlacementStaffs,
    getAllAdmins,
    getNonSuperAdminUsers,
    getOneUser
}