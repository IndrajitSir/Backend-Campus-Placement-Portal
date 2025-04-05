import { User } from "../models/user.models.js";
import { options } from "../constants.js";
import { generateAccessAndRefreshTokens } from "../utils/generateToken.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js"
import { Student } from "../models/student.model.js"
const logoutUser = asyncHandler(async (req, res) => {
    try {
        console.log("User logged Out");
        await User.findByIdAndUpdate(
            req.user._id,
            {
                $unset: {
                    refreshToken: 1 // this removes the field from document
                }
            },
            {
                new: true
            }
        )

        return res
            .status(200)
            .clearCookie("accessToken", options)
            .clearCookie("refreshToken", options)
            .json(new ApiResponse(200, {}, "User logged Out"))
    }
    catch (err) {
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
            return res.status(401).json(new ApiError(401, "Invalid refresh token"))
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            return res.status(401).json(new ApiError(401, "Refresh token is expired or used"))

        }
        const { accessToken, newRefreshToken } = await generateAccessAndRefreshTokens(user);

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: newRefreshToken },
                    "Access token refreshed"
                )
            )
    } catch (error) {
        return res.status(401).json(new ApiError(401, error?.message || "Invalid refresh token"))
    }

});

const changeCurrentPassword = asyncHandler(async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body
        const user = await User.findById(req.user?._id)
        const isPasswordCorrect = await user.isPasswordCorrect(oldPassword.toString())

        if (!isPasswordCorrect) {
            return res.status(400).json(new ApiError(400, "Invalid old password"))
        }

        user.password = newPassword
        await user.save({ validateBeforeSave: false })

        return res
            .status(200)
            .json(new ApiResponse(200, {}, "Password changed successfully"))
    }
    catch (err) {
        return res.status(500).json(new ApiError(500, "Server error"));
    }
});

const updatePhoneNumber = asyncHandler(async (req, res) => {
    try {
        const { phone } = req.body;
        if (!phone) {
            return res.status(400).json(new ApiError(400, "Phone number is missing!"))
        }
        const user = await User.findById(req.user?._id)

        user.phoneNumber = phone
        await user.save({ validateBeforeSave: false })

        return res
            .status(200)
            .json(new ApiResponse(200, {}, "Phone number changed successfully"))
    }
    catch (err) {
        return res.status(500).json(new ApiError(500, "Server error"));
    }
});

const getCurrentUser = asyncHandler(async (req, res) => {
    console.log("returning response");
    if (req.user.role === "student") {
        const student = await Student.findOne({student_id: req.user._id});
        console.log(`current user: ${student}`);       
        return res.status(200).json(new ApiResponse(200,
            { user: req.user, accessToken: req.cookies.accessToken, refreshToken: req.cookies.refreshToken, student: student },
            "User fetched successfully"));
    }
    return res.status(200).json(new ApiResponse(200,
        { user: req.user, accessToken: req.cookies.accessToken, refreshToken: req.cookies.refreshToken },
        "User fetched successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
    try {
        const { name, email, phone } = req.body

        if (!name || !email || !phone) {
            return res.status(400).json(new ApiError(400, "All fields are required"))
        }

        const user = await User.findByIdAndUpdate(
            req.user?._id,
            {
                $set: {
                    name,
                    email: email,
                    phoneNumber: phone
                }
            },
            { new: true }

        ).select("-password")

        return res
            .status(200)
            .json(new ApiResponse(200, user, "Account details updated successfully"))
    }
    catch (err) {
        return res.status(500).json(new ApiError(500, "Server error"));
    }
});

const changeCurrentName = asyncHandler(async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json(new ApiError(400, "Name is required"))
        }
        const user = await User.findByIdAndUpdate(req.user._id, {
            $set: {
                name: name
            }
        }, { new: true }).select("-password");
        return res
            .status(200)
            .json(new ApiResponse(200, user, "Name updated successfully"))
    } catch (err) {
        return res.status(500).json(new ApiError(500, "Server error"));
    }
});

const changeCurrentEmail = asyncHandler(async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json(new ApiError(400, "Email is required"))
        }
        const user = await User.findByIdAndUpdate(req.user._id, {
            $set: {
                email: email
            }
        }, { new: true }).select("-password");
        return res
            .status(200)
            .json(new ApiResponse(200, user, "Email updated successfully"))
    } catch (err) {
        return res.status(500).json(new ApiError(500, "Server error"));
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
}