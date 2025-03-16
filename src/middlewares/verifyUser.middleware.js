import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.models.js";
import jwt from "jsonwebtoken";

const verifyUserWithRole = (roles) => asyncHandler(async (req, _, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")

        if (!token) {
            return res.status(401).json(new ApiError(401, "Unauthorized request"))
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");

        if (!roles.includes(decodedToken.role)) {
            return res.status(403).json(new ApiError(403, "Access denied"))
        }

        if (!user) {
            return res.status(401).json(new ApiError(401, "Invalid Access Token"))
        }

        req.user = user;
        next()
    } catch (error) {
        return res.status(401).json(new ApiError(401, error?.message || "Invalid access token"))
    }
});

const verifyUser = asyncHandler(async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")

        if (!token) {
            return res.status(401).json(new ApiError(401, "Unauthorized request"))
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");

        if (!user) {
            return res.status(401).json(new ApiError(401, "Invalid Access Token"))
        }

        req.user = user;
        next()
    } catch (error) {
        return res.status(401).json(new ApiError(401, error?.message || "Invalid access token"))
    }
});

export { verifyUserWithRole, verifyUser }