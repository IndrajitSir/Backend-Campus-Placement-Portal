import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Placement } from "../models/placement.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const newPlacement = asyncHandler(async (req, res) => {
    try {
        const { company_name, job_title, description, eligibility, last_date } = req.body;
        if ([company_name, job_title, description, eligibility, last_date].some((field) => field?.trim() === "")) {
            return res.status(400).json(new ApiError(400, "All fields are required"));
        }

        const newPlacement = await Placement.create({
            company_name, job_title, description, eligibility, last_date,
            created_by: req.user.id
        });
        res.json(newPlacement);
        return res
            .status(201)
            .json(new ApiResponse(201, newPlacement, "New Placement registered Successfully"))
    } catch (err) {
        return res.status(500).json(new ApiError(500, "Server error"));
    }
});

const getAllPlacements = asyncHandler(async (req, res) => {
    try {
        const placements = await Placement.find();
        res.status(200)
            .json(new ApiResponse(200, placements, ""));
    } catch (err) {
        return res.status(500).json(new ApiError(500, "Server error"));
    }
});

const deletePlacement = asyncHandler(async (req, res) => {
    try {
        const id = req.params.id;
        if (!id) {
            return res.status(400).json(new ApiError(400, "ID is missing"));
        }
        await Placement.findByIdAndDelete(id);
        res
            .status(200)
            .json(new ApiResponse(200, {}, "Placement deleted"));
    } catch (err) {
        return res.status(500).json(new ApiError(500, "Server error"));
    }
});

const updatePlacement = asyncHandler(async (req, res) => {
    try {
        const id = req.params.id;
        const { updatedPlacementPost } = req.body;
        if (!id) {
            return res.status(400).json(new ApiError(400, "ID is missing"));
        }
        const updatedPlacement = await Placement.findByIdAndUpdate(id, {updatedPlacementPost}, {new: true});
        res
        .status(204)
        .json(new ApiResponse(204, updatePlacement, "Placement Post Updated"));
    } catch (error) {
        return res.status(500).json(new ApiError(500, "Server error"));
    }
})
export { newPlacement, getAllPlacements, deletePlacement, updatePlacement }