import { asyncHandler } from "../utils/asyncHandler.js";
import { Application } from "../models/application.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { Placement } from "../models/placement.model.js";
import logger from "../utils/Logger/logger.js";

const applyForPlacement = asyncHandler(async (req, res) => {
    const placementId = req.params.placementId;
    const userID = req.user._id;
    if (!placementId) {
        return res.status(400).json(new ApiError(400, "Placement ID is missing"));
    }
    if (!userID) {
        return res.status(400).json(new ApiError(400, "User ID is missing"));
    }
    try {
        const isApplied = await Application.findOne({
            $and: [{ user_id: userID }, { placement_id: placementId }]
        });
        if (isApplied) {
            logger.info(`Student with ${userID} has already applied to ${placementId}!`);
            return res.status(409).json(new ApiResponse(409, {}, "Already Applied!"));
        }
        console.log("user not applied before");

        const application = await Application.create({
            user_id: userID,
            placement_id: placementId,
            status: "applied"
        });
        if (!application) {
            logger.info(`Something went wrong while a student was applying for placement!`);
            return res.status(500).json(new ApiError(500, "Something went wrong while a student was applying for placement!"))
        }
        logger.info(`Student with ID: ${userID} applied to placement ID: ${placementId}`);
        return res.status(200).json(new ApiResponse(200, application, "Successfully applied for placement!"));
    } catch (err) {
        logger.error(`Error in apply placement: ${err.message}`, { stack: err.stack });
        return res.status(500).json(new ApiError(500, `Server error`));
    }
});

const appliedApplication = asyncHandler(async (req, res) => {
    await Placement.findById("2ee9bb9d6db1ba61e39a9255");//db["applications"].find({ placement_id: ObjectId("2ee9bb9d6db1ba61e39a9255") });
    try {
        const applications = await Application.find({ user_id: req.user._id }).populate("placement_id").populate("user_id");
        if (!applications) { return res.status(400).json(new ApiResponse(400, [], "No data found")); }
        logger.info(`Sending the applied application for student with ID: ${req.user._id} `);
        return res.status(200).json(new ApiResponse(200, applications, "Applied posts are Here!"));
    } catch (error) {
        logger.error(`Error while fetching applied placement post for student: ${error.message}`, { stack: error.stack });
        return res.status(500).json(new ApiError(500, `Server error`));
    }
});

const getAppliedCandidates = asyncHandler(async (_, res) => {
    try {
        logger.info("searching applied candidates!")
        const appliedCandidates = await Application.find({ status: "applied" }).populate("placement_id").populate("user_id");
        if (!Array.isArray(appliedCandidates) && !appliedCandidates.length > 0) {
            logger.info("No candidate has applied for any post!");
            return res.status(204).json(new ApiError(204, "No candidate has applied for any post!"));
        }
        logger.info(`Sending all the applied candidates!`);
        return res.status(200).json(new ApiResponse(200, appliedCandidates, ""));
    } catch (err) {
        logger.error(`Error while fetching applied candidates: ${err.message}`, { stack: err.stack });
        return res.status(500).json(new ApiError(500, "Server error"));
    }
});

const getSelectedCandidates = asyncHandler(async (_, res) => {
    try {
        const selectedCandidates = await Application.find({ status: "selected" }).populate("user_id").populate("placement_id");
        if (!Array.isArray(selectedCandidates) && !selectedCandidates.length > 0) {
            logger.info("No candidate has got selected as of now!");
            return res.status(204).json(new ApiError(204, "No candidate has got selected!"));
        }
        logger.info(`Sending all the selected candidates!`);
        return res.status(200).json(new ApiResponse(200, selectedCandidates, "Here are the selected candidates!"));
    } catch (error) {
        logger.error(`Error while fetching selected candidates: ${error.message}`, { stack: error.stack });
        return res.status(500).json(new ApiError(500, "Server error"));
    }
});

const getShortlistedCandidates = asyncHandler(async (_, res) => {
    try {
        const shortlistedCandidates = await Application.find({ status: "shortlisted" }).populate("placement_id").populate("user_id");
        if (!Array.isArray(shortlistedCandidates) && !shortlistedCandidates.length > 0) {
            logger.info("No candidate has got shortlisted as of now!");
            return res.status(204).json(new ApiError(204, "No candidate has got shortlisted!"));
        }
        logger.info(`Sending all the shortlisted candidates!`);
        return res.status(200).json(new ApiResponse(200, shortlistedCandidates, "Here are the shortlisted candidates!"));
    } catch (error) {
        logger.error(`Error while fetching shortlisted candidates: ${error.message}`, { stack: error.stack });
        return res.status(500).json(new ApiError(500, "Server error"));
    }
});

const getRejectedCandidates = asyncHandler(async (_, res) => {
    try {
        const rejectedCandidates = await Application.find({ status: "rejected" }).populate("placement_id").populate("user_id");
        if (!Array.isArray(rejectedCandidates) && !rejectedCandidates.length > 0) {
            logger.info("No candidate has got rejected as of now!");
            return res.status(204).json(new ApiError(204, "No candidate has got rejected!"));
        }
        logger.info(`Sending all the rejected candidates!`);
        return res.status(200).json(new ApiResponse(200, rejectedCandidates, "Here are the rejected candidates!"));
    } catch (error) {
        logger.error(`Error while fetching rejected candidates: ${error.message}`, { stack: error.stack });
        return res.status(500).json(new ApiError(500, "Server error"));
    }
});

const updateStatus = asyncHandler(async (req, res) => {
    const { newStatus, recordID } = req.body;
    if (!newStatus) { return res.status(400).json(new ApiError(400, "New Status is missing!")); }
    if (!recordID) { return res.status(400).json(new ApiError(400, "Record ID is missing!")); }
    const possibleStatus = ["shortlisted", "selected", "rejected"];
    if (!possibleStatus.includes(newStatus)) {
        logger.info("Got invalid status for update! It must be within shortlisted, selected or rejected")
        return res.status(400).json(new ApiError(400, "Not a valid status!"));
    }
    try {
        const record = await Application.findById(recordID);
        if (!record) {
            logger.info(`Cannot update the status! Application Record not found for the ID: ${recordID}.`)
            return res.status(404).json(new ApiError(404, "Application Record not found!"));
        }
        const updatedStatus = await Application.findByIdAndUpdate(recordID, { status: newStatus }, { new: true });
        if (!updatedStatus) {
            logger.info(`Something went wrong while updating status for applicant's application!`);
            return res.status(400).json(400, "Error while updating status of student application!")
        }
        logger.info(`Status updated of student application!`);
        return res.status(200).json(new ApiResponse(200, updatedStatus, "Status updated of student application!"))
    } catch (error) {
        logger.error(`Error while updating status for applicant's application!: ${error.message}`, { stack: error.stack });
        return res.status(500).json(new ApiError(500, "Server error"));
    }
});

const deleteApplicationRecord = asyncHandler(async (req, res) => {
    const { recordID } = req.body;
    if (!recordID) { return res.status(400).json(new ApiError(400, "Record ID is missing!")); }
    try {
        const record = await Application.findById(recordID);
        if (!record) {
            logger.info(`Cannot delete the Application! Application Record not found for the ID: ${recordID}.`)
            return res.status(404).json(new ApiError(404, "Application Record not found!"));
        }

        const deletedRecord = await Application.findByIdAndDelete(recordID);
        if (!deletedRecord) {
            logger.info(`Something went wrong while deleting applicant's application!`);
            return res.status(400).json(400, "Error while deleting student application record!")
        }
        logger.info(`student application got deleted successfully!`);
        return res.status(204).json(new ApiResponse(204, {}, "Application Record deleted successfully!"))
    } catch (error) {
        logger.error(`Error while deleting applicant's application!: ${error.message}`, { stack: error.stack });
        return res.status(500).json(new ApiError(500, "Server error"));
    }
});

export {
    applyForPlacement,
    appliedApplication,
    getAppliedCandidates,
    getSelectedCandidates,
    getShortlistedCandidates,
    getRejectedCandidates,
    updateStatus,
    deleteApplicationRecord
}