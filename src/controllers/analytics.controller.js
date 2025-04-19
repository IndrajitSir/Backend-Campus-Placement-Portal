import { User } from "../models/user.models.js";
import { Student } from "../models/student.model.js";
import { Placement } from '../models/placement.model.js'
import { Application } from "../models/application.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import logger from "../utils/Logger/logger.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const getUserCountByRole = asyncHandler(async (req, res) => {
    const data = await User.aggregate([
        { $group: { _id: "$role", count: { $sum: 1 } } }
    ]);
    logger.info("Successfully fetched users count by role!");
    return res.status(200).json(new ApiResponse(200, data, "Successfully fetched users count by role!"));
});

const getStudentsPerDepartment = asyncHandler(async (req, res) => {
    const data = await Student.aggregate([
        { $group: { _id: "$department", count: { $sum: 1 } } }
    ]);
    logger.info("Successfully fetched Students of each Department!");
    return res.status(200).json(new ApiResponse(200, data, "Successfully fetched Students of each Department!"));
});

const getSelectedStudentsPerDepartment = asyncHandler(async (req, res) => {
    const data = await Student.aggregate([
        {
            $lookup: {
                from: "applications",
                localField: "student_id",
                foreignField: "user_id",
                as: "applications"
            }
        },
        {
            $addFields: {
                selected: {
                    $gt: [
                        {
                            $size: {
                                $filter: {
                                    input: "$applications",
                                    as: "app",
                                    cond: { $eq: ["$$app.status", "selected"] }
                                }
                            }
                        },
                        0
                    ]
                }
            }
        },
        {
            $addFields: {
                applied: {
                    $gt: [
                        {
                            $size: {
                                $filter: {
                                    input: "$applications",
                                    as: "app",
                                    cond: { $eq: ["$$app.status", "applied"] }
                                }
                            }
                        },
                        0
                    ]
                }
            }
        },
        {
            $addFields: {
                shortlisted: {
                    $gt: [
                        {
                            $size: {
                                $filter: {
                                    input: "$applications",
                                    as: "app",
                                    cond: { $eq: ["$$app.status", "shortlisted"] }
                                }
                            }
                        },
                        0
                    ]
                }
            }
        },
        {
            $addFields: {
                rejected: {
                    $gt: [
                        {
                            $size: {
                                $filter: {
                                    input: "$applications",
                                    as: "app",
                                    cond: { $eq: ["$$app.status", "rejected"] }
                                }
                            }
                        },
                        0
                    ]
                }
            }
        },
        {
            $group: {
                _id: "$department",
                total: { $sum: 1 },
                selected: { $sum: { $cond: ["$selected", 1, 0] } },
                applied: { $sum: { $cond: ["$applied", 1, 0] } },
                shortlisted: { $sum: { $cond: ["$shortlisted", 1, 0] } },
                rejected: { $sum: { $cond: ["$rejected", 1, 0] } }
            }
        }
    ]);
    logger.info("Successfully fetched Selected, Shortlisted, Rejected and Applied Students of each Department!");
    return res.status(200).json(200, data, "Successfully fetched Selected, Shortlisted, Rejected and Applied Students of each Department!");
});

const getPlacementsCreatedPerMonth = asyncHandler(async (req, res) => {
    const data = await Placement.aggregate([
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                totalPlacements: { $sum: 1 }
            }
        },
        { $sort: { _id: 1 } }
    ]);
    logger.info("Successfully fetched how many placements have created per month!");
    return res.status(200).json(200, data, "Successfully fetched how many placements have created per month!");
});

const getApplicationsPerPlacement = asyncHandler(async (req, res) => {
    const data = await Application.aggregate([
        {
            $lookup: {
                from: "placements",
                localField: "placement_id",
                foreignField: "_id",
                as: "placement"
            }
        },
        { $unwind: "$placement" },
        {
            $group: {
                _id: "$placement.job_title",
                company: { $first: "$placement.company_name" },
                totalApplications: { $sum: 1 }
            }
        }
    ]);
    logger.info("Successfully fetched number of applications per placement!");
    return res.status(200).json(200, data, "Successfully fetched number of applications per placement!");
});

const getApplicationStatusSummary = asyncHandler(async (req, res) => {
    const data = await Application.aggregate([
        {
            $group: {
                _id: "$status",
                count: { $sum: 1 }
            }
        }
    ]);
    logger.info("Successfully fetched status summary of applications!");
    return res.status(200).json(200, data, "Successfully fetched status summary of applications!");
});

const getResumeUploadStats = asyncHandler(async (req, res) => {
    const data = await Student.aggregate([
        {
            $group: {
                _id: { hasResume: { $ne: ["$resume", ""] } },
                count: { $sum: 1 }
            }
        }
    ]);
    logger.info("Successfully fetched how many users have their resumes!");
    return res.status(200).json(200, data, "Successfully fetched how many users have their resumes!");
});

const getStudentsByLocation = asyncHandler(async (req, res) => {
    const data = await Student.aggregate([
        {
            $group: {
                _id: "$location",
                count: { $sum: 1 }
            }
        },
        { $sort: { count: -1 } }
    ]);
    logger.info("Successfully fetched students by their location!");
    return res.status(200).json(200, data, "Successfully fetched students by their location!");
});

const getStudentApprovalStats = asyncHandler(async (req, res) => {
    const data = await Student.aggregate([
        {
            $group: {
                _id: "$approved",
                count: { $sum: 1 }
            }
        }
    ]);
    logger.info("Successfully fetched student approval statistics!");
    return res.status(200).json(200, data, "Successfully fetched student approval statistics!");
});

const getTopActiveStudents = asyncHandler(async (req, res) => {
    const data = await Application.aggregate([
        {
            $group: {
                _id: "$user_id",
                applications: { $sum: 1 }
            }
        },
        { $sort: { applications: -1 } },
        { $limit: 10 },
        {
            $lookup: {
                from: "users",
                localField: "_id",
                foreignField: "_id",
                as: "user"
            }
        },
        { $unwind: "$user" },
        {
            $project: {
                name: "$user.name",
                email: "$user.email",
                applications: 1
            }
        }
    ]);
    logger.info("Successfully fetched top active students!");
    return res.status(200).json(200, data, "Successfully fetched top active students!");
});

export {
    getUserCountByRole,
    getStudentsPerDepartment,
    getSelectedStudentsPerDepartment,
    getPlacementsCreatedPerMonth,
    getApplicationsPerPlacement,
    getApplicationStatusSummary,
    getResumeUploadStats,
    getStudentsByLocation,
    getStudentApprovalStats,
    getTopActiveStudents
}