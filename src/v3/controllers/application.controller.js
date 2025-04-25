import { Application } from "../../models/application.model.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const getCandidatesByStatus = asyncHandler(async (req, res) => {
  const status = req.params.candidateStatus;
  const validStatuses = ["applied", "selected", "shortlisted", "rejected"];

  const parsedStatus = status?.split("-")[0]; 

  if (!validStatuses.includes(parsedStatus)) {
    return res.status(400).json(new ApiError(400, "Invalid status parameter"));
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  if (page < 1 || limit > 100) {
    logger.info("Page value or limit value is not set properly! in getCandidatesByStatus v3");
    return res.status(404).json(new ApiError(404, "Page value or limit value is not set properly!"));
}
  const total = await Application.countDocuments({ status: parsedStatus });

  const pipeline = [
    {
      $match: { status: parsedStatus}
    },
    {
      $sort: { createdAt: -1}
    },
    {
      $skip: skip
    },
    {
      $limit: limit
    },
    {
      $lookup: {
        from: "users",
        localField: "user_id",
        foreignField: "_id",
        as: "userInfo"
      }
    },
    {
      $unwind: "$userInfo",
    },
    {
      $lookup: {
        from: "students",
        localField: "user_id",
        foreignField: "student_id",
        as: "studentInfo"
      }
    },
    {
      $unwind: {
        path: "$studentInfo",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $lookup: {
        from: "placements",
        localField: "placement_id",
        foreignField: "_id",
        as: "placementInfo"
      }
    },
    {
      $unwind: "$placementInfo"
    },
    {
      $project: {
        _id: 1,
        status: 1,
        createdAt: 1,
        "userInfo._id": 1,
        "userInfo.name": 1,
        "userInfo.email": 1,
        "userInfo.phoneNumber": 1,
        "userInfo.role": 1,
        "studentInfo.resume": 1,
        "studentInfo.approved": 1,
        "studentInfo.location": 1,
        "studentInfo.about": 1,
        "studentInfo.professional_skill": 1,
        "studentInfo.department": 1,
        "studentInfo.projects": 1,
        "placementInfo.company_name": 1,
        "placementInfo.job_title": 1,
        "placementInfo.description": 1,
        "placementInfo.eligibility": 1,
        "placementInfo.location": 1,
        "placementInfo.last_date": 1,
      }
    }
  ];

  const applications = await Application.aggregate(pipeline);

  return res.status(200).json(
    new ApiResponse(200, {
      candidates: applications,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    }, `Fetched ${parsedStatus} candidates`)
  );
});

export { getCandidatesByStatus };