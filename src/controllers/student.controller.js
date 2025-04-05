import { Student } from "../models/student.model.js";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";

const uploadResume = asyncHandler(async (req, res) => {
    const resumeLocalPath = req.files?.resume[0]?.path;

    if (!resumeLocalPath) return res.status(401).json(new ApiError(401, "Resume is missing!"));

    const uploadedResume = await uploadOnCloudinary(resumeLocalPath);

    const student = await Student.findByIdAndUpdate(req.user._id, { resume: uploadedResume.url }, { new: true });

    if (!student) {
        return res.status(500).json(new ApiError(500, "Something went wrong while uploading the resume!"))
    }
    return res.status(201)
        .json(new ApiResponse(201, student, "Resume uploaded successfully!"))
});

const updateResume = asyncHandler(async (req, res) => {
    const newResumeLocalPath = req.files?.newResume[0]?.path;

    if (!newResumeLocalPath) return res.status(401).json(new ApiError(401, "Resume is missing!"));

    const student = await Student.find({ student_id: req.user._id });

    if (!student) return res.status(404).json(new ApiError(404, "Student not found!"));

    await deleteFromCloudinary(student.resume);
    const uploadedNewResume = await uploadOnCloudinary(newResumeLocalPath);

    const response = await Student.findOneAndUpdate({ student_id: req.user._id }, { $set: { resume: uploadedNewResume.url } }, { returnNewDocument: true });

    if (!response) {
        return res.status(500).json(new ApiError(500, "Something went wrong while uploading the resume!"))
    }
    return res.status(201)
        .json(new ApiResponse(201, response, "Resume updated successfully!"))
});

const deleteResume = asyncHandler(async (req, res) => {
    const student = await Student.find({ student_id: req.user._id });

    if (!student) return res.status(404).json(new ApiError(404, "Student not found!"));

    await deleteFromCloudinary(student.resume);

    const response = await Student.findOneAndDelete({ student_id: req.user._id }, { $set: { resume: null } }, { new: true });

    if (!response) {
        return res.status(500).json(new ApiError(500, "Something went wrong while uploading the resume!"))
    }
    return res.status(201)
        .json(new ApiResponse(201, response, "Resume updated successfully!"))
});

const getAllStudents = asyncHandler(async (req, res) => {
    try {
        const students = await Student.find();
        if (!students || students.length === 0) {
            const studentsFromUserDocument = await User.find({ role: "student" });
            if (!studentsFromUserDocument) {
                return res.status(404).json(new ApiError(404, "No student found!"))
            }
            return res.status(200)
                .json(new ApiResponse(200, studentsFromUserDocument, ""));
        }
        return res.status(200)
            .json(new ApiResponse(200, students, ""));
    } catch (err) {
        return res.status(500).json(new ApiError(500, "Server error"));
    }
});

const getOneStudent = asyncHandler(async (req, res) => {
    const { nameOremail } = req.body;
    if (!nameOremail) {
        return res.status(400).json(new ApiError(400, "value is missing"))
    }
    const existedStudent = await User.findOne({
        $or: [{ name: nameOremail }, { email: nameOremail }]
    })
    if (!existedUser) return res.status(409).json(new ApiError(409, "Student does not exists"));
    const student = await Student.findOne({ student_id: existedStudent._id }).populate("student_id").select("-password -refreshToken");
    return res.status(201).json(new ApiResponse(200, student, ""));
});

const updateLocation = asyncHandler(async (req, res) => {
    try {
        const { newLocation } = req.body;
        if (!newLocation) {
            return res.status(400).json(new ApiError(400, "Location is missing"));
        }
        const updatedRecord = await Placement.findByIdAndUpdate(req.user._id, { location: newLocation }, { new: true });
        return res.status(204).json(new ApiResponse(204, updatedRecord, "Location Updated"));
    } catch (error) {
        return res.status(500).json(new ApiError(500, "Server error"));
    }
});

const updateAbout = asyncHandler(async (req, res) => {
    try {
        const { newAbout } = req.body;
        if (!newAbout) {
            return res.status(400).json(new ApiError(400, "About is missing"));
        }
        const updatedRecord = await Placement.findByIdAndUpdate(req.user._id, { about: newAbout }, { new: true });
        return res.status(204).json(new ApiResponse(204, updatedRecord, "About Updated"));
    } catch (error) {
        return res.status(500).json(new ApiError(500, "Server error"));
    }
});

const updateProfessionalSkill = asyncHandler(async (req, res) => {
    try {
        const { newProfessionalSkill } = req.body;
        if (!newProfessionalSkill) {
            return res.status(400).json(new ApiError(400, "Professional Skill is missing"));
        }
        const updatedRecord = await Placement.findByIdAndUpdate(req.user._id, { professional_skill: newProfessionalSkill }, { new: true });
        return res.status(204).json(new ApiResponse(204, updatedRecord, "Professional Skill Updated"));
    } catch (error) {
        return res.status(500).json(new ApiError(500, "Server error"));
    }
});

const updateDepartment = asyncHandler(async (req, res) => {
    try {
        const { newDepartment } = req.body;
        if (!newDepartment) {
            return res.status(400).json(new ApiError(400, "Department value is missing"));
        }
        const updatedRecord = await Placement.findByIdAndUpdate(req.user._id, { department: newDepartment }, { new: true });
        return res.status(204).json(new ApiResponse(204, updatedRecord, "Department Updated"));
    } catch (error) {
        return res.status(500).json(new ApiError(500, "Server error"));
    }
});

const addNewProject = asyncHandler(async (req, res) => {
    try {
        const student_id = req.params.student_id;
        const { title, description, link } = req.body;

        if (!student_id || !title || !description || !link) {
            return res.status(400).json(new ApiError(400, "All fields are required!"));
        }

        const student = await Student.findById(student_id);
        if (!student) return res.status(404).json(new ApiError(404, "Student not found!"));

        student.projects.push({ title, description, link });
        await student.save();

        const addedProject = student.projects[student.projects.length - 1];

        return res.status(201).json(new ApiResponse(201, { project_id: addedProject._id, student }, "Project added successfully!"));
    } catch (error) {
        return res.status(500).json(new ApiError(500, "Server error!"));
    }
});

const updateProject = asyncHandler(async (req, res) => {
    try {
        const student_id = req.params.student_id;
        const { project_id, title, description, link } = req.body;

        if (!student_id || !project_id) {
            return res.status(400).json(new ApiError(400, "Student ID and Project ID are required!"));
        }

        const student = await Student.findById(student_id);
        if (!student) return res.status(404).json(new ApiError(404, "Student not found!"));

        const project = student.projects.id(project_id);
        if (!project) return res.status(404).json(new ApiError(404, "Project not found!"));

        // Update project fields if provided
        if (title) project.title = title;
        if (description) project.description = description;
        if (link) project.link = link;

        await student.save();
        return res.status(200).json(new ApiResponse(200, student, "Project updated successfully!"));
    } catch (error) {
        return res.status(500).json(new ApiError(500, "Server error!"));
    }
});

const deleteProject = asyncHandler(async (req, res) => {
    try {
        const student_id = req.params.student_id;
        const { project_id } = req.body;

        if (!student_id || !project_id) {
            return res.status(400).json(new ApiError(400, "Student ID and Project ID are required!"));
        }

        const student = await Student.findById(student_id);
        if (!student) return res.status(404).json(new ApiError(404, "Student not found!"));

        const projectIndex = student.projects.findIndex((p) => p._id.toString() === project_id);
        if (projectIndex === -1) return res.status(404).json(new ApiError(404, "Project not found!"));

        student.projects.splice(projectIndex, 1);
        await student.save();

        return res.status(200).json(new ApiResponse(200, student, "Project deleted successfully!"));
    } catch (error) {
        return res.status(500).json(new ApiError(500, "Server error!"));
    }
});

const getProjects = asyncHandler(async (req, res) => {
    const { student_id } = req.body;
    if (!student_id) { return res.status(400).json(new ApiError(400, "Student ID is missing!")); }

    const student = await Student.findById(student_id);
    if (!student) {
        const studentFromUserSchema = await User.findById(student_id);
        if (!studentFromUserSchema) { return res.status(404).json(new ApiError(404, "Student is not found!")); }
        return res.status(404).json(new ApiError(404, "No projects found!"));
    }

    return res.status(200).json(new ApiResponse(200, student.projects, ""));
});

const updateApproval = asyncHandler(async (req, res) => { // will be approved by admin
    try {
        const { student_id } = req.body;
        if (!student_id) {
            return res.status(400).json(new ApiError(400, "Student ID is Required"))
        }
        const student = await Student.findById(student_id);
        if (!student) {
            return res.status(404).json(new ApiError(404, "Student is not found!"));
        }
        const updatedStudent = await Student.findOneAndUpdate({ student_id: student._id }, {
            $set: {
                approved: !student.approved
            }
        }, { new: true }).populate("student_id").select("-password");

        return res
            .status(200)
            .json(new ApiResponse(200, updatedStudent, "Approval changed successfully"))
    } catch (err) {
        return res.status(500).json(new ApiError(500, "Server error"));
    }
});

const uploadAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.files?.avatar[0]?.path;

    if (!avatarLocalPath) return res.status(401).json(new ApiError(401, "Avatar is missing!"));

    const student = await Student.find({ student_id: req.user._id });

    if (!student) return res.status(404).json(new ApiError(404, "Student not found!"));
    if (student.avatar === "") {
        const uploadedAvatar = await uploadOnCloudinary(avatarLocalPath);
        const response = await Student.findOneAndUpdate({ student_id: req.user._id }, { $set: { avatar: uploadedAvatar.url } }, { new: true });
        if (!response) {
            return res.status(500).json(new ApiError(500, "Something went wrong while uploading the Avatar!"))
        }
        return res.status(200)
            .json(new ApiResponse(200, response, "Avatar updated successfully!"))
    }
    await deleteFromCloudinary(student.avatar);
    const uploadedAvatar = await uploadOnCloudinary(avatarLocalPath);

    const response = await Student.findOneAndUpdate({ student_id: req.user._id }, { $set: { resume: uploadedAvatar.url } }, { new: true });

    if (!response) {
        return res.status(500).json(new ApiError(500, "Something went wrong while uploading the Avatar!"))
    }
    return res.status(200)
        .json(new ApiResponse(200, response, "Avatar updated successfully!"))
});
export {
    uploadResume,
    updateResume,
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