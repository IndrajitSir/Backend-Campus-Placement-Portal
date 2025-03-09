import { asyncHandler } from "../utils/asyncHandler";
import { Application } from "../models/application.model";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";

const applyForPlacement = asyncHandler(async (req, res) => {
    try {
        const placementId = req.params.placementId;
        const userID = req.user.id;
        if (!placementId) {
            throw new ApiError(400, "Placement ID is missing");
        }
        if (!userID) {
            throw new ApiError(400, "User ID is missing");
        }
        const application = await Application.create({
            user_id: userID,
            placement_id: placementId,
            status: "applied"
        });

        res.status(200)
            .json(new ApiResponse(200, application, ""));
    } catch (err) {
        throw new ApiError(500, "Server error");
    }
});

const appliedApllications = asyncHandler(async (req, res) => {
    try {
        const applications = await Application.find({ user_id: req.user.id }).populate("placement_id");
        res.status(200)
        .json(new ApiResponse(200, applications, ""));
    } catch (err) {
        throw new ApiError(500, "Server error");
    }
});

export { applyForPlacement, appliedApllications }