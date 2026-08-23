import { Router } from 'express';
import { upload } from '../middlewares/multer.middleware.js';
import {
    deleteResume,
    getAllStudents,
    getOneStudent,
    uploadResume,
    updateLocation,
    updateAbout,
    updateProfessionalSkill,
    updateDepartment,
    addNewProject,
    updateProject,
    deleteProject,
    getProjects,
    uploadAvatar } from '../controllers/student.controller.js';
import { verifyUserWithRole } from '../middlewares/verifyUser.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
    updateLocationValidation,
    updateAboutValidation,
    updateProfessionalSkillValidation,
    updateDepartmentValidation,
    addProjectValidation,
    updateProjectValidation,
    deleteProjectValidation,
    getProjectsValidation,
    getOneStudentValidation
} from '../validations/student.validation.js';
const router = Router();

const studentRoles = ["student"];
const staffRoles = ["placement_staff", "super_admin", "admin"];

router.route("/upload-resume").put(upload.single('resume'), verifyUserWithRole(studentRoles), uploadResume);
router.route("/delete-resume").delete(verifyUserWithRole(studentRoles), deleteResume);
router.route("/all").get(verifyUserWithRole(staffRoles), getAllStudents);
router.route("/").get(verifyUserWithRole(staffRoles), getOneStudentValidation, validate, getOneStudent);
router.route("/update-location").put(verifyUserWithRole(studentRoles), updateLocationValidation, validate, updateLocation);
router.route("/update-about").put(verifyUserWithRole(studentRoles), updateAboutValidation, validate, updateAbout);
router.route("/update-professional_skill").put(verifyUserWithRole(studentRoles), updateProfessionalSkillValidation, validate, updateProfessionalSkill);
router.route("/update-department").put(verifyUserWithRole(studentRoles), updateDepartmentValidation, validate, updateDepartment);
router.route("/add-project/:student_id").post(verifyUserWithRole(studentRoles), addProjectValidation, validate, addNewProject);
router.route("/update-project/:student_id").put(verifyUserWithRole(studentRoles), updateProjectValidation, validate, updateProject);
router.route("/delete-project/:student_id").delete(verifyUserWithRole(studentRoles), deleteProjectValidation, validate, deleteProject);
router.route("/get-project").put(verifyUserWithRole(staffRoles), getProjectsValidation, validate, getProjects);
router.route("/upload-avatar").put(upload.single('avatar'), verifyUserWithRole(studentRoles), uploadAvatar);
export default router;
