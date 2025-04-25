import { asyncHandler } from "../../utils/asyncHandler.js";
import { Application } from "../../models/application.model.js";
import { Student } from "../../models/student.model.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import logger from "../../utils/Logger/logger.js";

const getAppliedCandidates = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    if (page < 1 || limit > 100) {
        logger.info("Page value or limit value is not set properly! in getAppliedCandidates v2");
        return res.status(404).json(new ApiError(404, "Page value or limit value is not set properly!"));
    }
    const appliedCandidates = await Application.find({ status: "applied" }).skip(skip).limit(limit).populate("placement_id").populate("user_id").select("-password -refreshToken");
    if(Array.isArray(appliedCandidates) && appliedCandidates.length <=0){
        logger.info("There is no applied candidates in the database!");
    }
    const total = await Application.countDocuments({ status: "applied" });
    
    return res.status(200).json(new ApiResponse(200, {
        appliedCandidates: appliedCandidates,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        total
    }, "Applied candidates fetched successfully"));
});

const getSelectedCandidates = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    if (page < 1 || limit > 100) {
        logger.info("Page value or limit value is not set properly! in getSelectedCandidates v2");
        return res.status(404).json(new ApiError(404, "Page value or limit value is not set properly!"));
    }
    const selectedCandidates = await Application.find({ status: "selected" }).skip(skip).limit(limit).populate("placement_id").populate("user_id").select("-password -refreshToken");
    if(Array.isArray(selectedCandidates) && selectedCandidates.length <=0){
        logger.info("There is no selected candidates in the database!");
    }
    const total = await Application.countDocuments({ status: "selected" });

    return res.status(200).json(new ApiResponse(200, {
        selectedCandidates: selectedCandidates,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        total
    }, "Selected candidates fetched successfully"));
});

const getShortlistedCandidates = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    if (page < 1 || limit > 100) {
        logger.info("Page value or limit value is not set properly! in getShortlistedCandidates v2");
        return res.status(404).json(new ApiError(404, "Page value or limit value is not set properly!"));
    }
    const shortlistedCandidates = await Application.find({ status: "shortlisted" }).skip(skip).limit(limit).populate("placement_id").populate("user_id").select("-password -refreshToken");
    if(Array.isArray(shortlistedCandidates) && shortlistedCandidates.length <=0){
        logger.info("There is no shortlisted candidates in the database!");
    }
    const total = await Application.countDocuments({ status: "shortlisted" });

    return res.status(200).json(new ApiResponse(200, {
        shortlistedCandidates: shortlistedCandidates,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        total
    }, "Shortlisted candidates fetched successfully"));
});

const getRejectedCandidates = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    if (page < 1 || limit > 100) {
        logger.info("Page value or limit value is not set properly! in getRejectedCandidates v2");
        return res.status(404).json(new ApiError(404, "Page value or limit value is not set properly!"));
    }
    const rejectedCandidates = await Application.find({ status: "rejected" }).skip(skip).limit(limit).populate("placement_id").populate("user_id").select("-password -refreshToken");
    if(Array.isArray(rejectedCandidates) && rejectedCandidates.length <=0){
        logger.info("There is no rejected candidates in the database!");
    }
    const total = await Application.countDocuments({ status: "rejected" });

    return res.status(200).json(new ApiResponse(200, {
        rejectedCandidates: rejectedCandidates,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        total
    }, "Rejected candidates fetched successfully"));
});

export { getAppliedCandidates, getSelectedCandidates, getShortlistedCandidates, getRejectedCandidates }