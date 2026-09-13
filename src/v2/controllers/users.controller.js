import { User } from "../../models/user.models.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import logger from "../../utils/Logger/logger.js";

const getAllPlacementStaffsOrAdmins = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const role = req.params.role;
    if (role !== "admin" && role !== "placement_staff") {
        logger.info(`Users with this role: ${role}, doesn't exists in the database!`);
        return res.status(404).json(new ApiError(404, "Users with this role doesn't exists in the database!"));
    }

    if (page < 1 || limit > 100) {
        logger.info("Page value or limit value is not set properly! in getAllPlacementStaffsOrAdmins v2")
        return res.status(404).json(new ApiError(404, "Page value or limit value is not set properly!"));
    }
    const total = await User.countDocuments();
    const users = await User.find({ role: role }).skip(skip).limit(limit).select("-password -refreshToken");

    return res.status(200).json(new ApiResponse(200,
        {
            users: users,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
        }, `Successfully fetched data of users having role as: ${role}`
    ));
});

const getAllUsers = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    if (page < 1 || limit > 100) {
        logger.info("Page value or limit value is not set properly! in getAllPlacementStaffsOrAdmins v2")
        return res.status(404).json(new ApiError(404, "Page value or limit value is not set properly!"));
    }
    const total = await User.countDocuments();
    const users = await User.find().skip(skip).limit(limit).select("-password -refreshToken");

    return res.status(200).json(new ApiResponse(200,
        {
            users: users,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
        }, `Successfully fetched data of users`
    ));
});

// Uploads the caller's E2EE public key (JWK JSON string). The private key
// never leaves the browser — the server only ever stores the public half.
const updateE2EEKey = asyncHandler(async (req, res) => {
    const { publicKey, keyVersion } = req.body || {};

    if (!publicKey || typeof publicKey !== "string" || publicKey.length > 4096) {
        throw new ApiError(400, "A valid publicKey (JWK JSON string) is required");
    }
    const parsedKeyVersion = Number(keyVersion);
    if (!Number.isInteger(parsedKeyVersion) || parsedKeyVersion < 1) {
        throw new ApiError(400, "A valid keyVersion (integer >= 1) is required");
    }

    await User.findByIdAndUpdate(req.user._id, {
        e2eePublicKey: publicKey,
        e2eeKeyVersion: parsedKeyVersion,
    });

    return res.status(200).json(
        new ApiResponse(200, { updated: true, keyVersion: parsedKeyVersion }, "E2EE public key updated")
    );
});

// Returns another user's public key so the caller can encrypt messages to
// them. Null-safe: legacy users who never generated a key return nulls.
const getE2EEKey = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const user = await User.findById(userId).select("e2eePublicKey e2eeKeyVersion");
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    return res.status(200).json(
        new ApiResponse(200, {
            userId: user._id,
            publicKey: user.e2eePublicKey || null,
            keyVersion: user.e2eeKeyVersion || null,
        }, "E2EE public key fetched")
    );
});

export { getAllPlacementStaffsOrAdmins, getAllUsers, updateE2EEKey, getE2EEKey }