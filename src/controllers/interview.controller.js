import { asyncHandler } from '../utils/asyncHandler.js';
import { Interview } from '../models/interview.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';

export const saveInterviewData = asyncHandler(async (req, res) => {
  const { interviewer, interviewee, fullCode, snapshotImage, explanation, language, questionForSnapshot } = req.body;

  if (!interviewer || !interviewee || !fullCode || !snapshotImage || !explanation || !language) {
    throw new ApiError(400, "Missing required fields");
  }

  const interview = await Interview.create({
    interviewer,
    interviewee,
    fullCode,
    snapshotImage,
    explanation,
    language,
    questionForSnapshot,
  });

  return res.status(201).json(new ApiResponse(201, interview, "Interview response saved successfully!"));
});

export const getInterviewSessions = asyncHandler(async (req, res) => {
  const interviews = await Interview.find()
    .populate("interviewer", "name email")
    .populate("interviewee", "name email")
    .sort({ createdAt: -1 });

  return res.status(200).json(new ApiResponse(200, interviews, "Fetched all interview sessions"));
});