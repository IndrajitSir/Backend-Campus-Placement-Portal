import { Student } from "../models/student.model.js";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import logger from "../utils/Logger/logger.js";
import redis from "../utils/redisClient.js";

const uploadResume = asyncHandler(async (req, res) => {
    console.log(`resume: ${req.files?.resume} and resume[0]: ${req.files?.resume[0]}`);
    const resumeLocalPath = req.files?.resume[0]?.path;
    if (!resumeLocalPath) return res.status(401).json(new ApiError(401, "Resume is missing!"));
    try {
        const student = await Student.find({ student_id: req.user._id });
        if (!student) {
            logger.info(`Student doesn't exists! Error while searching for student in upload resume.`);
            return res.status(404).json(new ApiError(404, "Student not found!"));
        }
        if (student.resume === "") {
            const uploadedResume = await uploadOnCloudinary(resumeLocalPath);
            const response = await Student.findOneAndUpdate({ student_id: req.user._id }, { $set: { resume: uploadedResume.url } }, { new: true });
            if (!response) {
                logger.info(`Something went wrong while updating the resume in the database for the student with ID: ${student._id} and Name: ${student._id}!`)
                return res.status(500).json(new ApiError(500, "Something went wrong while updating the resume in the database!"))
            }
            logger.info(`Resume updated successfully for the student with ID: ${student._id} and Name: ${student._id}!`)
            return res.status(200)
                .json(new ApiResponse(200, response, "Resume updated successfully!"))
        }
        await deleteFromCloudinary(student.resume);
        const uploadedResume = await uploadOnCloudinary(resumeLocalPath);

        const response = await Student.findByIdAndUpdate(req.user._id, { resume: uploadedResume.url }, { new: true });

        if (!response) {
            logger.info(`Something went wrong while updating the resume in the database for the student with ID: ${student._id} and Name: ${student._id}!`)
            return res.status(500).json(new ApiError(500, "Something went wrong while uploading the resume!"))
        }
        logger.info(`Resume updated successfully for the student with ID: ${student._id}!`)
        return res.status(201)
            .json(new ApiResponse(201, response, "Resume uploaded successfully!"))
    } catch (error) {
        logger.error(`Error in resume upload: ${error.message}`, { stack: error.stack });
        return res.status(500).json(new ApiError(500, `Server error`));
    }
});

const deleteResume = asyncHandler(async (req, res) => {
    try {
        const student = await Student.find({ student_id: req.user._id });

        if (!student) {
            logger.info(`Student doesn't exists! Error while searching for student in delete resume.`);
            return res.status(404).json(new ApiError(404, "Student not found!"));
        }

        if (student.resume === "") {
            logger.info(`A student with ID: ${student._id} is trying to delete his resume but the resume does not exists.`)
            return res.status(404).json(new ApiResponse(404, {}, "Resume is Unavailable!"))
        }
        await deleteFromCloudinary(student.resume);

        const response = await Student.findOneAndDelete({ student_id: req.user._id }, { $set: { resume: null } }, { new: true });

        if (!response) {
            logger.info(`Something went wrong while deleting the resume in the database for the student with ID: ${student._id} and Name: ${student._id}!`)
            return res.status(500).json(new ApiError(500, "Something went wrong while uploading the resume!"))
        }
        logger.info(`Resume deleted successfully for the student with ID: ${student._id}!`)
        return res.status(201)
            .json(new ApiResponse(201, response, "Resume updated successfully!"))
    } catch (error) {
        logger.error(`Error in delete resume : ${error.message}`, { stack: error.stack });
        return res.status(500).json(new ApiError(500, `Server error`));
    }
});

const getAllStudents = asyncHandler(async (req, res) => {
    const cacheKey = "students:all";
    try {
        const cached = await redis.get(cacheKey);
        if (cached) {
            return res.status(200).json(new ApiResponse(200, JSON.parse(cached), "All students fetched from cache!"));
        }
        const students = await Student.find().populate("student_id").lean();
        if (!students || students.length === 0) {
            const studentsFromUserDocument = await User.find({ role: "student" }).lean();
            if (!studentsFromUserDocument) {
                logger.info("Trying to get all students but No student found!")
                return res.status(404).json(new ApiError(404, "No student found!"))
            }
            logger.info("Fetched all students, Returning all students data!")
            return res.status(200).json(new ApiResponse(200, studentsFromUserDocument, ""));
        }
        await redis.set(cacheKey, JSON.stringify(students), "EX", 600);
        return res.status(200).json(new ApiResponse(200, students, ""));
    } catch (err) {
        logger.error(`Error while fetching all students: ${err.message}`, { stack: err.stack });
        return res.status(500).json(new ApiError(500, "Server error"));
    }
});

const getOneStudent = asyncHandler(async (req, res) => {
    const { nameOremail } = req.body;
    if (!nameOremail) return res.status(400).json(new ApiError(400, "value is missing"))
    try {
        const existedStudent = await User.findOne({ $or: [{ name: nameOremail }, { email: nameOremail }] })
        if (!existedUser) {
            logger.info(`Student with ${nameOremail} does not exists in the database!`)
            return res.status(409).json(new ApiError(409, "Student does not exists"));
        }
        logger.info(`Sending ${nameOremail} data in response!`);
        const student = await Student.findOne({ student_id: existedStudent._id }).populate("student_id").select("-password -refreshToken");
        return res.status(201).json(new ApiResponse(200, student, ""));
    } catch (error) {
        logger.error(`Error in get all students : ${error.message}`, { stack: error.stack });
        return res.status(500).json(new ApiError(500, `Server error`));
    }
});

const updateLocation = asyncHandler(async (req, res) => {
    const { newLocation } = req.body;
    if (!newLocation) return res.status(400).json(new ApiError(400, "Location is missing"));
    try {
        const updatedRecord = await Student.findByIdAndUpdate(req.user._id, { location: newLocation }, { new: true });
        if (!updatedRecord) {
            logger.info("Error occured while User was trying to update his location!");
            return res.status(400).json(new ApiError(400, "Some error ocuured while updating location"))
        }
        return res.status(204).json(new ApiResponse(204, updatedRecord, "Location Updated"));
    } catch (error) {
        logger.error(`Error in update location : ${error.message}`, { stack: error.stack });
        return res.status(500).json(new ApiError(500, "Server error"));
    }
});

const updateAbout = asyncHandler(async (req, res) => {
    const { newAbout } = req.body;
    if (!newAbout) return res.status(400).json(new ApiError(400, "New About field is missing"));
    try {
        const updatedRecord = await Student.findByIdAndUpdate(req.user._id, { about: newAbout }, { new: true });
        if (!updatedRecord) {
            logger.info("Error occured while User was trying to update his about field!");
            return res.status(400).json(new ApiError(400, "Some error ocuured while updating about field"))
        }
        return res.status(204).json(new ApiResponse(204, updatedRecord, "About field Updated"));
    } catch (error) {
        logger.error(`Error in update about field : ${error.message}`, { stack: error.stack });
        return res.status(500).json(new ApiError(500, "Server error"));
    }
});

const updateProfessionalSkill = asyncHandler(async (req, res) => {
    const { newProfessionalSkill } = req.body;
    if (!newProfessionalSkill) return res.status(400).json(new ApiError(400, "Professional Skill is missing"));
    try {
        const updatedRecord = await Student.findByIdAndUpdate(req.user._id, { professional_skill: newProfessionalSkill }, { new: true });
        if (!updatedRecord) {
            logger.info("Error occured while User was trying to update his Professional Skill field!");
            return res.status(400).json(new ApiError(400, "Some error ocuured while updating Professional Skill field"))
        }
        return res.status(204).json(new ApiResponse(204, updatedRecord, "Professional Skill Updated"));
    } catch (error) {
        logger.error(`Error in update Professional Skill field : ${error.message}`, { stack: error.stack });
        return res.status(500).json(new ApiError(500, "Server error"));
    }
});

const updateDepartment = asyncHandler(async (req, res) => {
    const { newDepartment } = req.body;
    if (!newDepartment) return res.status(400).json(new ApiError(400, "Department value is missing"));
    try {
        const updatedRecord = await Student.findByIdAndUpdate(req.user._id, { department: newDepartment }, { new: true });
        if (!updatedRecord) {
            logger.info("Error occured while User was trying to update his Department field!");
            return res.status(400).json(new ApiError(400, "Some error ocuured while updating Department field"))
        }
        return res.status(204).json(new ApiResponse(204, updatedRecord, "Department Updated"));
    } catch (error) {
        logger.error(`Error in update Department field : ${error.message}`, { stack: error.stack });
        return res.status(500).json(new ApiError(500, "Server error"));
    }
});

const addNewProject = asyncHandler(async (req, res) => {
    const student_id = req.params.student_id;
    const { projects } = req.body;

    projects.forEach(async (project) => {
        const { title, description, link } = project;
        if (!student_id || !title || !description || !link) {
            return res.status(400).json(new ApiError(400, "All fields are required!"));
        }
        try {
            const student = await Student.findById(student_id);
            if (!student) {
                logger.info(`Student with the ID: ${student_id}, not found in the database, cannot add a new project!!`);
                return res.status(404).json(new ApiError(404, "Student not found!"));
            }

            student.projects.push({ title, description, link });
            await student.save();

            const addedProject = student.projects[student.projects.length - 1];

            return res.status(201).json(new ApiResponse(201, { project_id: addedProject._id, student }, "Project added successfully!"));
        } catch (error) {
            logger.error(`Error in add new project : ${error.message}`, { stack: error.stack });
            return res.status(500).json(new ApiError(500, "Server error!"));
        }
    });
});

const updateProject = asyncHandler(async (req, res) => {
    const student_id = req.params.student_id;
    const { project_id, title, description, link } = req.body;

    if (!student_id || !project_id) {
        return res.status(400).json(new ApiError(400, "Student ID and Project ID are required!"));
    }
    try {
        const student = await Student.findById(student_id);
        if (!student) {
            logger.info(`Student with the ID: ${student_id}, not found in the database, cannot update project!!`);
            return res.status(404).json(new ApiError(404, "Student not found!"));
        }

        const project = student.projects.id(project_id);
        if (!project) return res.status(404).json(new ApiError(404, "Project not found!"));

        // Update project fields 
        if (title) project.title = title;
        if (description) project.description = description;
        if (link) project.link = link;

        await student.save();
        return res.status(200).json(new ApiResponse(200, student, "Project updated successfully!"));
    } catch (error) {
        logger.error(`Error in update project : ${error.message}`, { stack: error.stack });
        return res.status(500).json(new ApiError(500, "Server error!"));
    }
});

const deleteProject = asyncHandler(async (req, res) => {
    const student_id = req.params.student_id;
    const { project_id } = req.body;

    if (!student_id || !project_id) {
        return res.status(400).json(new ApiError(400, "Student ID and Project ID are required!"));
    }
    try {
        const student = await Student.findById(student_id);
        if (!student) {
            logger.info(`Student with the ID: ${student_id} not found in the database, so cannot delete the project!!`)
            return res.status(404).json(new ApiError(404, "Student not found!"));
        }

        const projectIndex = student.projects.findIndex((p) => p._id.toString() === project_id);
        if (projectIndex === -1) return res.status(404).json(new ApiError(404, "Project not found!"));

        student.projects.splice(projectIndex, 1);
        await student.save();

        return res.status(200).json(new ApiResponse(200, student, "Project deleted successfully!"));
    } catch (error) {
        logger.error(`Error in delete project : ${error.message}`, { stack: error.stack });
        return res.status(500).json(new ApiError(500, "Server error!"));
    }
});

const getProjects = asyncHandler(async (req, res) => {
    const { student_id } = req.body;
    if (!student_id) { return res.status(400).json(new ApiError(400, "Student ID is missing!")); }
    try {
        const student = await Student.findById(student_id);
        if (!student) {
            const studentFromUserSchema = await User.findById(student_id);
            if (!studentFromUserSchema) { return res.status(404).json(new ApiError(404, "Student is not found!")); }
            return res.status(404).json(new ApiError(404, "No projects found!"));
        }

        return res.status(200).json(new ApiResponse(200, student?.projects, "Projects fetched successfully!"));
    } catch (error) {
        logger.error(`Error while fetching project for a student : ${error.message}`, { stack: error.stack });
        return res.status(500).json(new ApiError(500, "Server error!"));
    }
});

const updateApproval = asyncHandler(async (req, res) => { // will be approved by admin
    try {
        const { student_id } = req.body;
        if (!student_id) {
            logger.info(`Student ID is Required: ${student_id} and type of: ${typeof student_id}`);
            return res.status(400).json(new ApiError(400, "Student ID is Required"))
        }
        const student = await Student.findById(student_id);
        if (!student) {
            logger.info(`Student with the ID: ${student_id} is not found in the database!`)
            return res.status(404).json(new ApiError(404, "Student is not found!"));
        }
        const updatedStudent = await Student.findByIdAndUpdate(student_id, {
            $set: {
                approved: !student.approved
            }
        }, { new: true }).populate("student_id").select("-password");
        if (!updatedStudent) {
            logger.info(`Error while updating approval of a student!!`);
            return res.status(400).json(new ApiError(400, "Some error occured while updating approval of student!"))
        }
        return res.status(200).json(new ApiResponse(200, updatedStudent, "Approval changed successfully"))
    } catch (err) {
        logger.error(`Error while updating approval to a student : ${err.message}`, { stack: err.stack });
        return res.status(500).json(new ApiError(500, "Server error"));
    }
});

const uploadAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.files?.avatar[0]?.path;
    if (!avatarLocalPath) return res.status(401).json(new ApiError(401, "Avatar file is missing!"));
    try {
        const student = await Student.find({ student_id: req.user._id });

        if (!student) return res.status(404).json(new ApiError(404, "Student not found!"));
        if (student.avatar === "") {
            const uploadedAvatar = await uploadOnCloudinary(avatarLocalPath);
            const response = await Student.findOneAndUpdate({ student_id: req?.user._id }, { $set: { avatar: uploadedAvatar.url } }, { new: true });
            if (!response) {
                return res.status(500).json(new ApiError(500, "Something went wrong while updating the Avatar!"))
            }
            return res.status(200).json(new ApiResponse(200, response, "Avatar updated successfully!"))
        }
        await deleteFromCloudinary(student.avatar);
        const uploadedAvatar = await uploadOnCloudinary(avatarLocalPath);

        const response = await Student.findOneAndUpdate({ student_id: req.user._id }, { $set: { resume: uploadedAvatar.url } }, { new: true });

        if (!response) {
            logger.info(`Error while updating avatar of a student! Student ID: ${req?.user._id}`);
            return res.status(500).json(new ApiError(500, "Something went wrong while updating the Avatar!"))
        }
        return res.status(200).json(new ApiResponse(200, response, "Avatar updated successfully!"))
    } catch (error) {
        logger.error(`Error in update avatar : ${err.message}`, { stack: err.stack });
        return res.status(500).json(new ApiError(500, "Server error"));
    }
});
export {
    uploadResume,
    deleteResume,
    getAllStudents,
    getOneStudent,
    updateLocation,
    updateAbout,
    updateProfessionalSkill,
    updateDepartment,
    addNewProject,
    updateProject,
    deleteProject,
    getProjects,
    updateApproval, // use in admin route
    uploadAvatar
}