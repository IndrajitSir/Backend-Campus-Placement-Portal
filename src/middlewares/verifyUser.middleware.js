import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.models.js";
import jwt from "jsonwebtoken";
import logger from "../utils/Logger/logger.js";

const extractToken = (req) =>
  req.header("Authorization")?.replace("Bearer ", "") || req.cookies?.accessToken || null;

/**
 * Verifies the access token and optionally enforces a role.
 *
 * The token carries only the user _id (email/name/role are never embedded).
 * The role is ALWAYS fetched from the DB by _id and checked against the
 * fresh document — never trusted from the token — so role changes take
 * effect immediately and a stale token can't grant stale privileges.
 */
const verifyUserWithRole = (roles) =>
  asyncHandler(async (req, res, next) => {
    const token = extractToken(req);
    if (!token) {
      throw new ApiError(401, "Unauthorized request");
    }

    let decodedToken;
    try {
      decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    } catch (error) {
      logger.warn(`Token verification failed: ${error?.message}`);
      throw new ApiError(401, error?.name === "TokenExpiredError" ? "Session expired, please log in again" : "Invalid access token");
    }

    // Fetch the user from the DB by _id first
    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "Invalid access token");
    }

    if (!roles.includes(user.role)) {
      throw new ApiError(403, "Access denied");
    }

    req.user = user;
    next();
  });

const verifyUser = asyncHandler(async (req, res, next) => {
  const token = extractToken(req);
  if (!token) {
    throw new ApiError(401, "Unauthorized request");
  }

  let decodedToken;
  try {
    decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  } catch (error) {
    logger.warn(`Token verification failed: ${error?.message}`);
    throw new ApiError(401, error?.name === "TokenExpiredError" ? "Session expired, please log in again" : "Invalid access token");
  }

  const user = await User.findById(decodedToken?._id);
  if (!user) {
    throw new ApiError(401, "Invalid access token");
  }

  req.user = user;
  next();
});

export { verifyUserWithRole, verifyUser };
