import { asyncHandler } from "../../utils/asyncHandler.js";
import { Placement } from "../../models/placement.model.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import logger from "../../utils/Logger/logger.js";

const getAllPlacementsPaginated = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;
    const skip = (page - 1) * limit;
    if (page < 1 || limit > 100) {
        logger.info("Page value or limit value is not set properly! in getAllPlacementsPaginated v2")
        return res.status(404).json(new ApiError(404, "Page value or limit value is not set properly!"));
    }
    const placements = await Placement.find().sort({ createdAt: -1 }).skip(skip).limit(limit);
    const total = await Placement.countDocuments();

    res.status(200).json(new ApiResponse(200, {
        data: placements,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        total
    }, "Placements fetched successfully"));
});

export { getAllPlacementsPaginated }