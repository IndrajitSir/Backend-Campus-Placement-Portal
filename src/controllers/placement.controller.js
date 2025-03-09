import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { Placement } from "../models/placement.model";
import { ApiResponse } from "../utils/ApiResponse";

const newPlacement = asyncHandler(async (req, res) => {
    try {
        const { company_name, job_title, description, eligibility, last_date } = req.body;
        if ([company_name, job_title, description, eligibility, last_date].some((field) => field?.trim() === "")) {
            throw new ApiError(400, "All fields are required");
        }

        const newPlacement = await Placement.create({
            company_name, job_title, description, eligibility, last_date,
            created_by: req.user.id
        });
        res.json(newPlacement);
        return res
            .status(201)
            .json(new ApiResponse(200, newPlacement, "New Placement registered Successfully"))
    } catch (err) {
        throw new ApiError(500, "Server error");
    }
});

const getAllPlacements = asyncHandler(async (req, res) => {
    try {
        const placements = await Placement.find();
        res
            .status(200)
            .json(new ApiResponse(200, placements, ""));
    } catch (err) {
        throw new ApiError(500, "Server error");
    }
});

const deletePlacement = asyncHandler(async (req, res) => {
    try {
        const id = req.params.id;
        if (!id) {
            throw new ApiError(400, "ID is missing");
        }
        await Placement.findByIdAndDelete(id);
        res
        .status(200)
        .json(new ApiResponse(200, {}, "Placement deleted"));
    } catch (err) {
        throw new ApiError(500, "Server error");
    }
});
export { newPlacement, getAllPlacements, deletePlacement }