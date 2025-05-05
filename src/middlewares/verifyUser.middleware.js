import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.models.js";
import jwt from "jsonwebtoken";
import logger from "../utils/Logger/logger.js";

const verifyUserWithRole = (roles) => asyncHandler(async (req, res, next) => {
    try {
        const token = req.header("Authorization")?.replace("Bearer ", "") || req.cookies?.accessToken;
        // console.log("request arrived in roles");
        // console.log(`token: ${req.header("Authorization")} || ${req.cookies?.accessToken}`);

        if (!token) {
            return res.status(401).json(new ApiError(401, "Unauthorized request"))
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findById(decodedToken?._id);
        // console.log(`Decoded Token: ${JSON.stringify(decodedToken)} role: ${decodedToken.role}`);
        
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
        const token = req.header("Authorization")?.replace("Bearer ", "") || req.cookies?.accessToken 

        if (!token) {
            // console.log("Unauthorized request")
            return res.status(401).json(new ApiError(401, "Unauthorized request"))
        }
        // console.log("request arrived in non role auth");
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findById(decodedToken?._id);
        
        if (!user) {
            // console.log("Invalid Access Token")
            return res.status(401).json(new ApiError(401, "Invalid Access Token"))
        }
        // console.log("Token verified");

        req.user = user;
        next()
    } catch (error) {
        return res.status(401).json(new ApiError(401, error?.message || "Invalid access token"))
    }
});

export { verifyUserWithRole, verifyUser }