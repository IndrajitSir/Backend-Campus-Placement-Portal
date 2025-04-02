import { asyncHandler } from "../utils/asyncHandler.js";
import { Application } from "../models/application.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

const applyForPlacement = asyncHandler(async (req, res) => {
    try {
        const placementId = req.params.placementId;
        const userID = req.user._id;
        if (!placementId) {
            return res.status(400).json(new ApiError(400, "Placement ID is missing"));
        }
        if (!userID) {
            return res.status(400).json(new ApiError(400, "User ID is missing"));
        }
        const isApplied = await Application.findOne({
            $and: [{user_id: userID, placement_id: placementId, status: "applied"}]
        });
        if(isApplied){
            return res.status(409).json(new ApiResponse(409, "Already Applied!"));
        }
        const application = await Application.create({
            user_id: userID,
            placement_id: placementId,
            status: "applied"
        });

        res.status(200)
            .json(new ApiResponse(200, application, ""));
    } catch (err) {
        return res.status(500).json(new ApiError(500, "Server error"));
    }
});

const appliedApllications = asyncHandler(async (req, res) => {
    try {
        const applications = await Application.find({ user_id: req.user._id }).populate("placement_id");
        res.status(200)
        .json(new ApiResponse(200, applications, ""));
    } catch (err) {
        return res.status(500).json(new ApiError(500, "Server error"));
    }
});

export { applyForPlacement, appliedApllications }