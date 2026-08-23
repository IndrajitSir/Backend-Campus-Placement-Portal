import { asyncHandler } from "../../utils/asyncHandler.js"
import mongoose from "mongoose";
import { FriendRequest } from "../models/friendRequest.model.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js"
import logger from "../../utils/Logger/logger.js";
import { getSocketId } from "../../socket/socket.js";

const sendFrindRequest = asyncHandler(async (req, res) => {
    const { receiverId } = req.body;
    const senderId = req.user._id.toString();
    if (!receiverId) return res.status(400).json(new ApiError(400, "Receiver id is missing"));
    if (!mongoose.Types.ObjectId.isValid(receiverId)) { return res.status(400).json(new ApiError(400, "Invalid receiver ID format")); }
    if (senderId === receiverId) return res.status(400).json(new ApiError(400, "Cannot send friend request to yourself"));
    try {
        const existing = await FriendRequest.findOne({ sender: senderId, receiver: receiverId });
        if (existing) return res.status(400).json(new ApiError(400, "Request already sent."));

        const newRequest = await FriendRequest.create({ sender: senderId, receiver: receiverId });
        if (!newRequest) { 
            logger.error("Error at send friend request while creating new document");
            return res.status(400).json(new ApiError(400, "Error while creating new document")); 
        }
        const receiverSocketId = getSocketId(receiverId);
        if (receiverSocketId) {
            req.io.to(receiverSocketId).emit("friend:request", {
                senderId: senderId,
                requestId: newRequest._id,
                message: "You have a new friend request"
            });
        }
        return res.status(200).json(new ApiResponse(200, newRequest, "New friend request has been sended!"));
    } catch (err) {
        logger.info("Error at send friend request: ", err);
        return res.status(500).json(new ApiError(500, "Server Error!"));
    }
});

const incomingFrindRequest = asyncHandler(async (req, res) => {
    try {
        const requests = await FriendRequest.find({ receiver: req.user._id, status: "pending" }).populate("sender", "name avatar");
        return res.status(200).json(new ApiResponse(200, requests, ""));
    } catch (err) {
        logger.info("Error at incoming friend request: ", err);
        return res.status(500).json(new ApiError(500, "Server Error!"));
    }
});

const respondToFrindRequest = asyncHandler(async (req, res) => {
    const { requestId, action } = req.body;
    if (!requestId || !action) return res.status(400).json(new ApiError(400, "requestId and action are required"));
    if (!['accepted', 'rejected'].includes(action)) return res.status(400).json(new ApiError(400, "Action must be 'accepted' or 'rejected'"));
    const message = (action === 'accepted') ? "🎊Congratulations! You got a new friend" : "";
    try {
        const request = await FriendRequest.findById(requestId);
        if (!request) return res.status(404).json(new ApiError(404, "Friend request not found"));
        // IDOR protection: only the receiver can respond
        if (request.receiver.toString() !== req.user._id.toString()) {
            return res.status(403).json(new ApiError(403, "You can only respond to requests sent to you"));
        }
        request.status = action;
        await request.save();
        if (!request) { 
            logger.error("Error at respond to friend request while updating document");
            return res.status(400).json(new ApiError(400, "Error while updating document")); 
        }
        return res.status(200).json(new ApiResponse(200, request, message));
    } catch (err) {
        logger.info("Error at respond to friend request: ", err);
        return res.status(500).json(new ApiError(500, "Server Error!"));
    }
});

const getAllFriends = asyncHandler(async (req, res) => {
    const id = req.user._id.toString();
    try {
        const friends = await FriendRequest.find({ status: "accepted", $or: [{ sender: id }, { receiver: id }] }).populate("sender", "name avatar").populate("receiver", "name avatar");
        if (!Array.isArray(friends) || friends.length === 0) { return res.status(200).json(new ApiResponse(200, [], "No friends yet")); }
        return res.status(200).json(new ApiResponse(200, friends, "All friends fetched successfully!"));
    } catch (err) {
        logger.info("Error at get all friend: ", err);
        return res.status(500).json(new ApiError(500, "Server Error!"));
    }
});

export { sendFrindRequest, incomingFrindRequest, respondToFrindRequest, getAllFriends }