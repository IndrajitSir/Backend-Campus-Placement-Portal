import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Placement } from "../models/placement.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import logger from "../utils/Logger/logger.js";
import redis from "../utils/redisClient.js";
import mongoose, { Schema } from "mongoose";

const newPlacement = asyncHandler(async (req, res) => {
    const { company_name, job_title, description, eligibility, location, last_date } = req.body;
    if ([company_name, job_title, description, eligibility, location, last_date].some((field) => field?.trim() === "")) {
        return res.status(400).json(new ApiError(400, "All fields are required"));
    }
    try {
        const newPlacement = await Placement.create({
            company_name, job_title, description, eligibility, location, last_date,
            created_by: req.user._id
        });
        if (!newPlacement) {
            logger.info(`Something went wrong while registering new placement post!`);
            return res.status(500).json(new ApiError(500, "Something went wrong while registering new placement post!"))
        }
        logger.info(`New Placement registered Successfully!! Placement: ${JSON.stringify(newPlacement)}`);
        return res.status(201)
            .json(new ApiResponse(201, newPlacement, "New Placement registered Successfully"))
    } catch (err) {
        logger.error(`Error while creating new placement: ${err.message}`, { stack: err.stack });
        return res.status(500).json(new ApiError(500, `Server error`));

    }
});

const getAllPlacements = asyncHandler(async (req, res) => {
    const cacheKey = "placement:all";
    try {
        const cached = await redis.get(cacheKey);
        if (cached) {
            return res.status(200).json(new ApiResponse(200, JSON.parse(cached), "All placement posts fetched from cache!"));
        }
        const placements = await Placement.find().lean();
        if (!Array.isArray(placements) && !placements.length > 0) {
            logger.info("There is no placement post!!");
            return res.status(204).json(new ApiError(204, "No placement post found!"))
        }
        await redis.set(cacheKey, JSON.stringify(placements), "EX", 600);
        return res.status(200).json(new ApiResponse(200, placements, "All placement posts fetched!"));
    } catch (err) {
        logger.error(`Error in get all placements: ${err.message}`, { stack: err.stack });
        return res.status(500).json(new ApiError(500, "Server error"));
    }
});

const deletePlacement = asyncHandler(async (req, res) => {
    const id = req.params.id;
    if (!id) return res.status(400).json(new ApiError(400, "ID is missing"));

    try {
        if(!mongoose.Types.ObjectId.isValid(id)){ return res.status(400).json(new ApiError(400, "Invalid ID format"))}
        const placement = await Placement.findById(id);
        if (!placement) {
            logger.info(`Thers is no placement post for this id ${id}! Hence the placement post cannot be deleted.`);
            return res.status(204).json(new ApiError(204, "Placement post not found!"));
        }
        const deletedPlacement = await Placement.findByIdAndDelete(id);
        if (!deletedPlacement) {
            logger.info(`Something went wrong while deleting placement post! whose ID: ${id}`);
            return res.status(500).json(new ApiError(500, "Something went wrong while deleting placement post!"))
        }
        logger.info(`A placement post with id ${id} deleted successfully!`);
        return res.status(200).json(new ApiResponse(200, deletedPlacement, "Placement deleted"));
    } catch (err) {
        logger.error(`Error in delete placement: ${err.message}`, { stack: err.stack });
        return res.status(500).json(new ApiError(500, "Server error"));
    }
});

const updatePlacement = asyncHandler(async (req, res) => {
    const id = req.params.id;
    const { newPlacementPost } = req.body;
    if (!id) return res.status(400).json(new ApiError(400, "ID is missing"));
    if (!newPlacementPost) return res.status(400).json(new ApiError(400, "Updated Placement Post is missing"));
    try {
        if(!mongoose.Types.ObjectId.isValid(id)){ return res.status(400).json(new ApiError(400, "Invalid ID format"))}
        const placement = await Placement.findById(id);
        if (!placement) {
            logger.info(`Thers is no placement post for this id ${id}! Hence the placement post cannot be updated.`);
            return res.status(204).json(new ApiError(204, "Placement post not found!"));
        }
        const updatedPlacement = await Placement.findByIdAndUpdate(id, { newPlacementPost }, { new: true });
        if (!updatedPlacement) {
            logger.info(`Something went wrong while updating placement post! whose ID: ${id}`);
            return res.status(500).json(new ApiError(500, "Something went wrong while updating placement post!"))
        }
        logger.info(`A placement post with id ${id} updated successfully!`);
        return res.status(204).json(new ApiResponse(204, updatedPlacement, "Placement Post Updated"));
    } catch (error) {
        logger.error(`Error in update placement: ${error.message}`, { stack: error.stack });
        return res.status(500).json(new ApiError(500, "Server error"));
    }
});

const updateJobTitle = asyncHandler(async (req, res) => {
    const id = req.params.id;
    const { newJobTitle } = req.body;
    if (!id) return res.status(400).json(new ApiError(400, "ID is missing"));
    if (!newJobTitle) return res.status(400).json(new ApiError(400, "Job title is missing"));
    try {
        const placement = await Placement.findById(id);
        if (!placement) {
            logger.info(`Thers is no placement post for this id ${id}! Hence job title for the placement post cannot be updated.`);
            return res.status(204).json(new ApiError(204, "Placement post not found!"));
        }
        const updatedPlacement = await Placement.findByIdAndUpdate(id, { job_title: newJobTitle }, { new: true });
        if (!updatedPlacement) {
            logger.info(`Something went wrong while updating job title of a placement post! whose ID: ${id}`);
            return res.status(500).json(new ApiError(500, "Something went wrong while updating job title!"))
        }
        logger.info(`A placement post's job title updated successfully! whose ID: ${id}`);
        return res.status(204).json(new ApiResponse(204, updatedPlacement, "Job Title Updated"));
    } catch (error) {
        logger.error(`Error in update Job title: ${error.message}`, { stack: error.stack });
        return res.status(500).json(new ApiError(500, "Server error"));
    }
});

const updateDescription = asyncHandler(async (req, res) => {
    const id = req.params.id;
    const { newDescription } = req.body;
    if (!id) return res.status(400).json(new ApiError(400, "ID is missing"));
    if (!newDescription) return res.status(400).json(new ApiError(400, "New Job description is missing"));
    try {
        const placement = await Placement.findById(id);
        if (!placement) {
            logger.info(`Thers is no placement post for this id ${id}! Hence description for the placement post cannot be updated.`);
            return res.status(204).json(new ApiError(204, "Placement post not found!"));
        }
        const updatedPlacement = await Placement.findByIdAndUpdate(id, { description: newDescription }, { new: true });
        if (!updatedPlacement) {
            logger.info(`Something went wrong while updating description of a placement post! whose ID: ${id}`);
            return res.status(500).json(new ApiError(500, "Something went wrong while updating description!"))
        }
        logger.info(`A placement post's description updated successfully! whose ID: ${id}`);
        return res.status(204).json(new ApiResponse(204, updatedPlacement, "Description Updated"));
    } catch (error) {
        logger.error(`Error in update description: ${error.message}`, { stack: error.stack });
        return res.status(500).json(new ApiError(500, "Server error"));
    }
});

const updateEligibility = asyncHandler(async (req, res) => {
    const id = req.params.id;
    const { newEligibility } = req.body;
    if (!id) return res.status(400).json(new ApiError(400, "ID is missing"));
    if (!newEligibility) return res.status(400).json(new ApiError(400, "New eligibility is missing"));
    try {
        const placement = await Placement.findById(id);
        if (!placement) {
            logger.info(`Thers is no placement post for this id ${id}! Hence eligibility for the placement post cannot be updated.`);
            return res.status(204).json(new ApiError(204, "Placement post not found!"));
        }
        const updatedPlacement = await Placement.findByIdAndUpdate(id, { eligibility: newEligibility }, { new: true });
        if (!updatedPlacement) {
            logger.info(`Something went wrong while updating eligibility of a placement post! whose ID: ${id}`);
            return res.status(500).json(new ApiError(500, "Something went wrong while updating eligibility!"))
        }
        logger.info(`A placement post's eligibility updated successfully! whose ID: ${id}`);
        return res.status(204).json(new ApiResponse(204, updatedPlacement, "Eligibility Updated"));
    } catch (error) {
        logger.error(`Error in update eligibility: ${error.message}`, { stack: error.stack });
        return res.status(500).json(new ApiError(500, "Server error"));
    }
});

const updateLocation = asyncHandler(async (req, res) => {
    const id = req.params.id;
    const { newLocation } = req.body;
    if (!id) return res.status(400).json(new ApiError(400, "ID is missing"));
    if (!newLocation) return res.status(400).json(new ApiError(400, "New location is missing"));
    try {
        const placement = await Placement.findById(id);
        if (!placement) {
            logger.info(`Thers is no placement post for this id ${id}! Hence location for the placement post cannot be updated.`);
            return res.status(204).json(new ApiError(204, "Placement post not found!"));
        }
        const updatedPlacement = await Placement.findByIdAndUpdate(id, { location: newLocation }, { new: true });
        if (!updatedPlacement) {
            logger.info(`Something went wrong while updating location of a placement post! whose ID: ${id}`);
            return res.status(500).json(new ApiError(500, "Something went wrong while updating location!"))
        }
        logger.info(`A placement post's location updated successfully! whose ID: ${id}`);
        return res.status(204).json(new ApiResponse(204, updatedPlacement, "Location Updated"));
    } catch (error) {
        logger.error(`Error in update location: ${error.message}`, { stack: error.stack });
        return res.status(500).json(new ApiError(500, "Server error"));
    }
});

const updateLastDate = asyncHandler(async (req, res) => {
    const id = req.params.id;
    const { newLastDate } = req.body;
    if (!id) return res.status(400).json(new ApiError(400, "ID is missing"));
    if (!newLastDate) return res.status(400).json(new ApiError(400, "New Last date is missing"));
    try {
        const placement = await Placement.findById(id);
        if (!placement) {
            logger.info(`Thers is no placement post for this id ${id}! Hence last date for the placement post cannot be updated.`);
            return res.status(204).json(new ApiError(204, "Placement post not found!"));
        }
        const updatedPlacement = await Placement.findByIdAndUpdate(id, { last_date: newLastDate }, { new: true });
        if (!updatedPlacement) {
            logger.info(`Something went wrong while updating last date of a placement post! whose ID: ${id}`);
            return res.status(500).json(new ApiError(500, "Something went wrong while updating last date!"))
        }
        logger.info(`A placement post's last date updated successfully! whose ID: ${id}`);
        return res.status(204).json(new ApiResponse(204, updatedPlacement, "Location Updated"));
    } catch (error) {
        logger.error(`Error in update last date: ${error.message}`, { stack: error.stack });
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