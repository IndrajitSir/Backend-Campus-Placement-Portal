import { Router } from 'express';
import { upload } from '../middlewares/multer.middleware.js';
import { 
    deleteResume, 
    getAllStudents, 
    getOneStudent, 
    updateResume, 
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

router.route("/upload-resume").post(upload.fields({name: "resume", maxCount: 1}), verifyUserWithRole(["student"]), uploadResume);
router.route("/update-resume").put(upload.fields({name: "newResume", maxCount: 1}), verifyUserWithRole(["student"]), updateResume);
router.route("/delete-resume").delete(verifyUserWithRole(["student"]), deleteResume);
router.route("/all").get(verifyUserWithRole(["placement_staff", "super_admin", "admin"]), getAllStudents);
router.route("/").get(verifyUserWithRole(["placement_staff", "super_admin", "admin"]), getOneStudent);
router.route("/update-location").put(verifyUserWithRole(["student"]), updateLocation);
router.route("/update-about").put(verifyUserWithRole(["student"]), updateAbout);
router.route("/update-professional_skill").put(verifyUserWithRole(["student"]), updateProfessionalSkill);
router.route("/update-department").put(verifyUserWithRole(["student"]), updateDepartment);
router.route("/update-location").put(verifyUserWithRole(["student"]), updateLocation);
router.route("/add-project").post(verifyUserWithRole(["student"]), addNewProject);
router.route("/update-project").put(verifyUserWithRole(["student"]), updateProject);
router.route("/delete-project").delete(verifyUserWithRole(["student"]), deleteProject);
router.route("/get-project").put(verifyUserWithRole(["placement_staff", "super_admin", "admin"]), getProjects);
router.route("/upload-avatar").post(upload.fields({name: "avatar", maxCount: 1}), verifyUserWithRole(["student"]), uploadAvatar);
export default router;