import { asyncHandler } from "../../utils/asyncHandler.js";
import { Student } from "../../models/student.model.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

const getAllStudents = asyncHandler(async (req, res) => {
    const page = parseInt(req.query?.page) || 1;
    const limit = parseInt(req.query?.limit) || 10;
    const skip = (page - 1) * limit;
    if (page < 1 || limit > 100) {
        logger.info("Page value or limit value is not set properly! in getAllStudents v2")
        return res.status(404).json(new ApiError(404, "Page value or limit value is not set properly!"));
    }
    const total = await Student.countDocuments();
    const students = await Student.find().skip(skip).limit(limit).populate("student_id").select("-password -refreshToken");

    return res.status(200).json(new ApiResponse(200,
        {
            students: students,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
        }, `Successfully fetched data of students!`
    ));
});

export { getAllStudents }