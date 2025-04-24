// in interview.route.js
import express from 'express';
import { saveInterviewData } from '../controllers/interview.controller.js';

const router = express.Router();
router.post('/', saveInterviewData);

export default router;
