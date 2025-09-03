import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import { ChatMessage } from "../models/chatMessage.model.js";
import { getSocketId } from "../../socket/socket.js";
import logger from "../../utils/Logger/logger.js";

const sendMessage = asyncHandler(async (req, res) => {
  const { senderId, receiverId, text } = req.body;
  const receiverSocketId = getSocketId(receiverId);
  let msg = '';
  try {
    msg = await ChatMessage.findOne({ sender: senderId, receiver: receiverId }).populate("sender", "name").populate("receiver", "name");
    if (msg?._id) {
      msg.message.push({ text: text });
      await msg.save();
      const addedMessage = msg.message[msg.message.length - 1];
      if (receiverSocketId) {
        req.io.to(receiverSocketId).emit("personalChat:newMessage", msg);
      }
      return res.status(200).json(new ApiResponse(200, addedMessage, "Message sended!"));
    }
    msg = await ChatMessage.create({ sender: senderId, receiver: receiverId, message: { text: text } }).populate("sender", "name").populate("receiver", "name");
    if (!msg) {
      logger.error("Error at send friend request while creating new document");
      return res.status(400).json(new ApiError(400, "Error while creating new document"));
    }
    if (receiverSocketId) {
      req.io.to(receiverSocketId).emit("personalChat:newMessage", msg);
    }
    return res.status(200).json(new ApiResponse(201, msg, ""));
  } catch (err) {
    logger.info("Error at send message: ", err);
    return res.status(500).json(new ApiError(500, "Server Error!"));
  }
});

const getConversation = asyncHandler(async (req, res) => {
  const { sender: user1, receiver: user2 } = req.params;
  const messages = await ChatMessage.find({
    $or: [
      { sender: user1, receiver: user2 },
      { sender: user2, receiver: user1 }
    ]
  }).sort("createdAt");
  return res.status(200).json(new ApiResponse(200, messages, ""));
})
export { sendMessage, getConversation }