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

const CSV_COLUMNS = ["Application ID", "Student Name", "Student Email", "Company", "Job Title", "Status", "Applied Date"];
const MAX_CSV_ROWS = 5000;

// CSV escaping: wrap in quotes and double any internal quotes.
const csvEscape = (value) => {
  if (value === null || value === undefined) return '""';
  const str = value instanceof Date ? value.toISOString() : String(value);
  return `"${str.replace(/"/g, '""')}"`;
};

const exportApplicationsCsv = asyncHandler(async (req, res) => {
  const status = req.query.status;
  const validStatuses = ["applied", "shortlisted", "selected", "rejected"];

  if (status && !validStatuses.includes(status)) {
    return res.status(400).json(new ApiError(400, "Invalid status filter"));
  }

  const filter = status ? { status } : {};
  const applications = await Application.find(filter)
    .sort({ createdAt: -1 })
    .limit(MAX_CSV_ROWS)
    .populate("user_id", "name email")
    .populate("placement_id", "company_name job_title");

  const rows = applications.map((app) => [
    app._id?.toString(),
    app.user_id?.name,
    app.user_id?.email,
    app.placement_id?.company_name,
    app.placement_id?.job_title,
    app.status,
    app.createdAt,
  ]);

  const csv = [
    CSV_COLUMNS.map(csvEscape).join(","),
    ...rows.map((row) => row.map(csvEscape).join(",")),
  ].join("\n");

  const dateStamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const fileName = `applications-${status || "all"}-${dateStamp}.csv`;

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
  return res.status(200).send(csv);
});

export { getCandidatesByStatus, exportApplicationsCsv };