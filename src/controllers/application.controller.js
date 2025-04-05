import { asyncHandler } from "../utils/asyncHandler.js";
import { Application } from "../models/application.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { Placement } from "../models/placement.model.js";
import { Schema } from "mongoose";

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
            $and: [{ user_id: userID, placement_id: placementId, status: "applied" }]
        });
        if (isApplied) {
            return res.status(409).json(new ApiResponse(409, {}, "Already Applied!"));
        }
        console.log("user not applied before");
        
        const application = await Application.create({
            user_id: userID,
            placement_id: placementId,
            status: "applied"
        });
        console.log("sending the response");
        
        return res.status(200).json(new ApiResponse(200, application, ""));
    } catch (err) {
        console.log(`error: ${err}`);       
        return res.status(500).json(new ApiError(500, `Server error: ${err}`));
    }
});

const appliedApplication = asyncHandler(async (req, res) => {
    console.log("searching applied post"); //db["applications"].find({ user_id: ObjectId("67eecb7cf7e6b0c4d1bfd5a9") });
    const dummyPlacement = await Placement.findById("2ee9bb9d6db1ba61e39a9255");//db["applications"].find({ placement_id: ObjectId("2ee9bb9d6db1ba61e39a9255") });
    console.log(dummyPlacement); 
    const applications = await Application.find({ user_id: req.user._id }).populate("placement_id").populate("user_id");
    if (!applications) { return res.status(400).json(new ApiResponse(400, [], "No data found")); }
    console.log("sending applied post", JSON.stringify(applications));
    return res.status(200).json(new ApiResponse(200, applications, ""));
});

const getAppliedCandidates = asyncHandler(async (req, res) => {
    try {
        console.log("searching applied candidates");
        const appliedCandidates = await Application.find({ status: "applied" }).populate("placement_id").populate("user_id");
        console.log("sending applied candidates");

        return res.status(200).json(new ApiResponse(200, appliedCandidates, ""));
    } catch (err) {
        return res.status(500).json(new ApiError(500, "Server error"));
    }
});

const getSelectedCandidates = asyncHandler(async (req, res) => {
    try {
        const selectedCandidates = await Application.find({ status: "selected" }).populate("user_id").populate("placement_id");
        return res.status(200).json(new ApiResponse(200, selectedCandidates, ""));
    } catch (error) {
        return res.status(500).json(new ApiError(500, "Server error"));
    }
});

const getShortlistedCandidates = asyncHandler(async (req, res) => {
    try {
        const shortlistedCandidates = await Application.find({ status: "shortlisted" }).populate("placement_id").populate("user_id");
        return res.status(200).json(new ApiResponse(200, shortlistedCandidates, ""));
    } catch (error) {
        return res.status(500).json(new ApiError(500, "Server error"));
    }
});

const getRejectedCandidates = asyncHandler(async (req, res) => {
    try {
        const rejectedCandidates = await Application.find({ status: "rejected" }).populate("placement_id").populate("user_id");
        return res.status(200).json(new ApiResponse(200, rejectedCandidates, ""));
    } catch (error) {
        return res.status(500).json(new ApiError(500, "Server error"));
    }
});

const updateStatus = asyncHandler(async (req, res) => {
    try {
        const { newStatus, student_id } = req.body;
        const possibleStatus = ["shortlisted", "selected", "rejected"];
        if (!possibleStatus.includes(newStatus)) { return res.status(400).json(new ApiError(400, "Not a valid status!")); }
        if (!newStatus) { return res.status(400).json(new ApiError(400, "New Status is missing!")); }

        const updatedStatus = await Application.findByIdAndUpdate({ user_id: student_id }, { status: newStatus }, { new: true });
        if (!updatedStatus) { return res.status(400).json(400, "Error while updating status of student application!") }
        return res.status(200).json(new ApiResponse(200, updatedStatus, "Status updated  of student application!"))
    } catch (error) {
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
}