import { Router } from 'express';
import { verifyUserWithRole } from '../middlewares/verifyUser.middleware.js';
import {
    getUserCountByRole,
    getStudentsPerDepartment,
    getSelectedStudentsPerDepartment,
    getPlacementsCreatedPerMonth,
    getApplicationsPerPlacement,
    getApplicationStatusSummary,
    getResumeUploadStats,
    getStudentsByLocation,
    getStudentApprovalStats,
    getTopActiveStudents,
    totalUsersCount,
    totalApplicationsCount,
    totalPlacementsCount
} from '../controllers/analytics.controller.js'

const router = Router();

router.use(verifyUserWithRole(["admin", "super_admin", "placement_staff"]));

router.route("/user-count-by-role").get(getUserCountByRole);
router.route("/students-per-department").get(getStudentsPerDepartment);
router.route("/selected-student-per-department").get(getSelectedStudentsPerDepartment);
router.route("/placement-created-per-month").get(getPlacementsCreatedPerMonth);
router.route("/applications-per-month").get(getApplicationsPerPlacement);
router.route("/application-status-summary").get(getApplicationStatusSummary);
router.route("/resume-upload-statistics").get(getResumeUploadStats);
router.route("/student-by-location").get(getStudentsByLocation);
router.route("/student-approval-statistics").get(getStudentApprovalStats);
router.route("/top-active-students").get(getTopActiveStudents);
router.route("/total-users").get(totalUsersCount);
router.route("/total-applications").get(totalApplicationsCount);
router.route("/total-placements").get(totalPlacementsCount);

export default router