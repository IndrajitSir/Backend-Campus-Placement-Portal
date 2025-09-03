import { User } from "../../models/user.models.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import logger from "../../utils/Logger/logger.js";

const getAllPlacementStaffsOrAdmins = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const role = req.params.role;
    if (role !== "admin" && role !== "placement_staff") {
        logger.info(`Users with this role: ${role}, doesn't exists in the database!`);
        return res.status(404).json(new ApiError(404, "Users with this role doesn't exists in the database!"));
    }

    if (page < 1 || limit > 100) {
        logger.info("Page value or limit value is not set properly! in getAllPlacementStaffsOrAdmins v2")
        return res.status(404).json(new ApiError(404, "Page value or limit value is not set properly!"));
    }
    const total = await User.countDocuments();
    const users = await User.find({ role: role }).skip(skip).limit(limit).select("-password -refreshToken");

    return res.status(200).json(new ApiResponse(200,
        {
            users: users,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
        }, `Successfully fetched data of users having role as: ${role}`
    ));
});

const getAllUsers = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    if (page < 1 || limit > 100) {
        logger.info("Page value or limit value is not set properly! in getAllPlacementStaffsOrAdmins v2")
        return res.status(404).json(new ApiError(404, "Page value or limit value is not set properly!"));
    }
    const total = await User.countDocuments();
    const users = await User.find().skip(skip).limit(limit).select("-password -refreshToken");

    return res.status(200).json(new ApiResponse(200,
        {
            users: users,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
        }, `Successfully fetched data of users`
    ));
});

export { getAllPlacementStaffsOrAdmins, getAllUsers }