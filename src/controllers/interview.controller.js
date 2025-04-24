import {asyncHandler} from '../utils/asyncHandler.js';
import { Interview } from '../models/interview.model.js';
import {ApiResponse} from '../utils/ApiResponse.js';
import {ApiError} from '../utils/ApiError.js';

export const saveInterviewData = asyncHandler(async (req, res) => {
  const { fullCode, language, snapshot, questionForSnapshot } = req.body;

  if (!fullCode || !language || !snapshot) {
    throw new ApiError(400, 'Missing required fields');
  }

  const interview = await Interview.create({
    fullCode,
    language,
    snapshot,
    questionForSnapshot
  });

  res.status(201).json(new ApiResponse(201, interview, 'Interview data saved successfully'));
});
