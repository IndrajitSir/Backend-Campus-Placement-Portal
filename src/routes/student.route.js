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
const router = Router();

router.route("/upload-resume").put(upload.single('resume'), verifyUserWithRole(["student"]), uploadResume);
router.route("/delete-resume").delete(verifyUserWithRole(["student"]), deleteResume);
router.route("/all").get(verifyUserWithRole(["placement_staff", "super_admin", "admin"]), getAllStudents);
router.route("/").get(verifyUserWithRole(["placement_staff", "super_admin", "admin"]), getOneStudent);
router.route("/update-location").put(verifyUserWithRole(["student"]), updateLocation);
router.route("/update-about").put(verifyUserWithRole(["student"]), updateAbout);
router.route("/update-professional_skill").put(verifyUserWithRole(["student"]), updateProfessionalSkill);
router.route("/update-department").put(verifyUserWithRole(["student"]), updateDepartment);
router.route("/update-location").put(verifyUserWithRole(["student"]), updateLocation);
router.route("/add-project/:student_id").post(verifyUserWithRole(["student"]), addNewProject);
router.route("/update-project/:student_id").put(verifyUserWithRole(["student"]), updateProject);
router.route("/delete-project/:student_id").delete(verifyUserWithRole(["student"]), deleteProject);
router.route("/get-project").put(verifyUserWithRole(["placement_staff", "super_admin", "admin"]), getProjects);
router.route("/upload-avatar").put(upload.single('avatar'), verifyUserWithRole(["student"]), uploadAvatar);
export default router;