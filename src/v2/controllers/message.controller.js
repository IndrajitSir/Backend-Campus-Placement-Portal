import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import { ChatMessage } from "../models/chatMessage.model.js";
import { getSocketId } from "../../socket/socket.js";
import logger from "../../utils/Logger/logger.js";

const sendMessage = asyncHandler(async (req, res) => {
  const { senderId, receiverId, text } = req.body;
  const receiverSocketId = getSocketId(receiverId);
  try {
    let msg = await ChatMessage.findOne({ sender: senderId, receiver: receiverId });
    if (msg?._id) {
      msg.message.push({ text });
      await msg.save();
      // On a document populate() returns a promise, so use the array form.
      await msg.populate([{ path: "sender", select: "name" }, { path: "receiver", select: "name" }]);
      const addedMessage = msg.message[msg.message.length - 1];
      if (receiverSocketId) {
        req.io.to(receiverSocketId).emit("personalChat:newMessage", msg);
      }
      return res.status(200).json(new ApiResponse(200, addedMessage, "Message sent!"));
    }
    msg = await ChatMessage.create({ sender: senderId, receiver: receiverId, message: [{ text }] });
    await msg.populate([{ path: "sender", select: "name" }, { path: "receiver", select: "name" }]);
    if (receiverSocketId) {
      req.io.to(receiverSocketId).emit("personalChat:newMessage", msg);
    }
    return res.status(201).json(new ApiResponse(201, msg, ""));
  } catch (err) {
    logger.info("Error at send message: ", err);
    return res.status(500).json(new ApiError(500, "Server Error!"));
  }
});

const getConversation = asyncHandler(async (req, res) => {
  const { senderId: user1, receiverId: user2 } = req.params;
  const messages = await ChatMessage.find({
    $or: [
      { sender: user1, receiver: user2 },
      { sender: user2, receiver: user1 }
    ]
  }).sort("createdAt").populate("sender", "name").populate("receiver", "name");
  return res.status(200).json(new ApiResponse(200, messages, ""));
})
export { sendMessage, getConversation }