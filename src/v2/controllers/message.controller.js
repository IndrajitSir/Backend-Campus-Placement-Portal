import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import { ChatMessage } from "../models/chatMessage.model.js";
import { getSocketId } from "../../socket/socket.js";
import logger from "../../utils/Logger/logger.js";

const sendMessage = asyncHandler(async (req, res) => {
  const { senderId, receiverId, text } = req.body;
  const receiverSocketId = getSocketId(receiverId);
  const senderSocketId = getSocketId(senderId);
  try {
    let msg = await ChatMessage.findOne({ sender: senderId, receiver: receiverId });
    if (!msg) {
      // Also check the reverse direction so an existing thread is reused
      msg = await ChatMessage.findOne({ sender: receiverId, receiver: senderId });
    }
    if (msg?._id) {
      msg.message.push({ text });
      await msg.save();
      // On a document populate() returns a promise, so use the array form.
      await msg.populate([{ path: "sender", select: "name" }, { path: "receiver", select: "name" }]);
      const addedMessage = msg.message[msg.message.length - 1];
      if (receiverSocketId) {
        req.io.to(receiverSocketId).emit("personalChat:newMessage", msg);
      }
      if (senderSocketId) {
        req.io.to(senderSocketId).emit("personalChat:newMessage", msg);
      }
      return res.status(200).json(new ApiResponse(200, addedMessage, "Message sent!"));
    }
    msg = await ChatMessage.create({ sender: senderId, receiver: receiverId, message: [{ text }] });
    await msg.populate([{ path: "sender", select: "name" }, { path: "receiver", select: "name" }]);
    if (receiverSocketId) {
      req.io.to(receiverSocketId).emit("personalChat:newMessage", msg);
    }
    if (senderSocketId) {
      req.io.to(senderSocketId).emit("personalChat:newMessage", msg);
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
const getConversations = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  try {
    // Find all chat documents where this user is sender or receiver
    const docs = await ChatMessage.find({
      $or: [{ sender: userId }, { receiver: userId }]
    })
      .sort({ updatedAt: -1 })
      .populate("sender", "name email")
      .populate("receiver", "name email");

    // Build a map of unique conversation partners
    const conversationMap = new Map();

    for (const doc of docs) {
      const senderId = doc.sender?._id?.toString();
      const receiverId = doc.receiver?._id?.toString();
      const otherUserId = senderId === userId ? receiverId : senderId;
      const otherUser = senderId === userId ? doc.receiver : doc.sender;

      if (!otherUser || !otherUserId) continue;

      // Only keep the most recent conversation per partner
      if (!conversationMap.has(otherUserId)) {
        const lastMsg = doc.message?.[doc.message.length - 1];
        // Count unread messages (messages where sender is the other user and isRead is false)
        let unreadCount = 0;
        for (const m of doc.message) {
          const msgSenderId = senderId === userId ? receiverId : senderId;
          if (msgSenderId !== userId && m.isRead === false) {
            unreadCount++;
          }
        }

        conversationMap.set(otherUserId, {
          user: {
            _id: otherUserId,
            name: otherUser.name,
            email: otherUser.email,
          },
          lastMessage: lastMsg?.text || "",
          lastMessageAt: lastMsg?.sentAt || doc.updatedAt,
          unreadCount,
        });
      }
    }

    // Sort by last message time descending
    const conversations = Array.from(conversationMap.values())
      .sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));

    return res.status(200).json(new ApiResponse(200, conversations, "Conversations fetched!"));
  } catch (err) {
    logger.error("Error fetching conversations: ", err);
    return res.status(500).json(new ApiError(500, "Server Error!"));
  }
});

export { sendMessage, getConversation, getConversations }