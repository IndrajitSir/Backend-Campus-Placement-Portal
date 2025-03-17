import { Router } from 'express';
import { upload } from '../middlewares/multer.middleware.js';
import { deleteResume, getAllStudents, getOneStudent, updateResume, uploadResume } from '../controllers/student.controller.js';
import { verifyUserWithRole } from '../middlewares/verifyUser.middleware.js';
const router = Router();

router.route("/upload-resume").post(upload.fields({name: "resume", maxCount: 1}), verifyUserWithRole(["student"]), uploadResume);
router.route("/update-resume").patch(upload.fields({name: "newResume", maxCount: 1}), verifyUserWithRole(["student"]), updateResume);
router.route("/delete-resume").delete(verifyUserWithRole(["student"]), deleteResume);
router.route("/all").get(verifyUserWithRole(["placement_staff", "super_admin", "admin"]), getAllStudents);
router.route("/").get(verifyUserWithRole(["placement_staff", "super_admin", "admin"]), getOneStudent);
export default router;