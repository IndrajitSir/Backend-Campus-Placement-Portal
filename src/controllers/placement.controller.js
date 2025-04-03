import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Placement } from "../models/placement.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const newPlacement = asyncHandler(async (req, res) => {
    try {
        const { company_name, job_title, description, eligibility, location, last_date } = req.body;
        if ([company_name, job_title, description, eligibility, location, last_date].some((field) => field?.trim() === "")) {
            return res.status(400).json(new ApiError(400, "All fields are required"));
        }

        const newPlacement = await Placement.create({
            company_name, job_title, description, eligibility, location, last_date,
            created_by: req.user._id
        });
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
        return res.status(200)
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
        return res.status(200).json(new ApiResponse(200, {}, "Placement deleted"));
    } catch (err) {
        return res.status(500).json(new ApiError(500, "Server error"));
    }
});

const updatePlacement = asyncHandler(async (req, res) => {
    try {
        const id = req.params.id;
        const { newPlacementPost } = req.body;
        if (!id) {
            return res.status(400).json(new ApiError(400, "ID is missing"));
        }
        const updatedPlacement = await Placement.findByIdAndUpdate(id, {newPlacementPost}, {new: true});
        return res.status(204).json(new ApiResponse(204, updatedPlacement, "Placement Post Updated"));
    } catch (error) {
        return res.status(500).json(new ApiError(500, "Server error"));
    }
});

const updateJobTitle = asyncHandler(async (req, res) => {
    try {
        const id = req.params.id;
        const { newJobTitle } = req.body;
        if (!id) {
            return res.status(400).json(new ApiError(400, "ID is missing"));
        }
        const updatedPlacement = await Placement.findByIdAndUpdate(id, {job_title: newJobTitle}, {new: true});
        return res.status(204).json(new ApiResponse(204, updatedPlacement, "Job Title Updated"));
    } catch (error) {
        return res.status(500).json(new ApiError(500, "Server error"));
    }
});

const updateDescription = asyncHandler(async (req, res) => {
    try {
        const id = req.params.id;
        const { newDescription } = req.body;
        if (!id) {
            return res.status(400).json(new ApiError(400, "ID is missing"));
        }
        const updatedPlacement = await Placement.findByIdAndUpdate(id, {description: newDescription}, {new: true});
        return res.status(204).json(new ApiResponse(204, updatedPlacement, "Description Updated"));
    } catch (error) {
        return res.status(500).json(new ApiError(500, "Server error"));
    }
});

const updateEligibility = asyncHandler(async (req, res) => {
    try {
        const id = req.params.id;
        const { newEligibility } = req.body;
        if (!id) {
            return res.status(400).json(new ApiError(400, "ID is missing"));
        }
        const updatedPlacement = await Placement.findByIdAndUpdate(id, {eligibility: newEligibility}, {new: true});
        return res.status(204).json(new ApiResponse(204, updatedPlacement, "Description Updated"));
    } catch (error) {
        return res.status(500).json(new ApiError(500, "Server error"));
    }
});

const updateLocation = asyncHandler(async (req, res) => {
    try {
        const id = req.params.id;
        const { newLocation } = req.body;
        if (!id) {
            return res.status(400).json(new ApiError(400, "ID is missing"));
        }
        const updatedPlacement = await Placement.findByIdAndUpdate(id, {location: newLocation}, {new: true});
        return res.status(204).json(new ApiResponse(204, updatedPlacement, "Location Updated"));
    } catch (error) {
        return res.status(500).json(new ApiError(500, "Server error"));
    }
});

const updateLastDate = asyncHandler(async (req, res) => {
    try {
        const id = req.params.id;
        const { newLastDate } = req.body;
        if (!id) {
            return res.status(400).json(new ApiError(400, "ID is missing"));
        }
        const updatedPlacement = await Placement.findByIdAndUpdate(id, {last_date: newLastDate}, {new: true});
        return res.status(204).json(new ApiResponse(204, updatedPlacement, "Location Updated"));
    } catch (error) {
        return res.status(500).json(new ApiError(500, "Server error"));
    }
});

export { 
    newPlacement, 
    getAllPlacements, 
    deletePlacement, 
    updatePlacement, 
    updateJobTitle, 
    updateDescription, 
    updateEligibility, 
    updateLocation, 
    updateLastDate, 
}