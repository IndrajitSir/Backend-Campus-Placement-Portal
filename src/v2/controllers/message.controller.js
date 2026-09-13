import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import { ChatMessage } from "../models/chatMessage.model.js";
import { getSocketId } from "../../socket/socket.js";
import logger from "../../utils/Logger/logger.js";

// Validates an E2EE envelope { iv, salt, data } (base64 strings).
const isValidEnvelope = (env) =>
  env &&
  typeof env.iv === "string" && env.iv.length > 0 && env.iv.length <= 64 &&
  typeof env.salt === "string" && env.salt.length > 0 && env.salt.length <= 128 &&
  typeof env.data === "string" && env.data.length > 0 && env.data.length <= 40000;

const sendMessage = asyncHandler(async (req, res) => {
  // senderId is always taken from the verified JWT user — never from the body
  const senderId = req.user._id.toString();
  const { receiverId, text, ciphertexts, keyVersion } = req.body;

  // E2EE path: server persists ciphertexts only and never sees plaintext.
  const encrypted =
    ciphertexts &&
    isValidEnvelope(ciphertexts.toSender) &&
    isValidEnvelope(ciphertexts.toReceiver);

  let messageEntry;
  if (encrypted) {
    const v = Number(keyVersion);
    messageEntry = {
      senderId,
      encrypted: true,
      ciphertexts: {
        toSender: {
          iv: ciphertexts.toSender.iv,
          salt: ciphertexts.toSender.salt,
          data: ciphertexts.toSender.data,
        },
        toReceiver: {
          iv: ciphertexts.toReceiver.iv,
          salt: ciphertexts.toReceiver.salt,
          data: ciphertexts.toReceiver.data,
        },
      },
      keyVersion: Number.isInteger(v) && v >= 1 ? v : 1,
    };
  } else {
    // Legacy plaintext path (old clients / fallback).
    messageEntry = { senderId, text };
  }

  const receiverSocketId = getSocketId(receiverId);
  const senderSocketId = getSocketId(senderId);
  try {
    let msg = await ChatMessage.findOne({ sender: senderId, receiver: receiverId });
    if (!msg) {
      // Also check the reverse direction so an existing thread is reused
      msg = await ChatMessage.findOne({ sender: receiverId, receiver: senderId });
    }
    if (msg?._id) {
      msg.message.push(messageEntry);
      await msg.save();
      await msg.populate([{ path: "sender", select: "name" }, { path: "receiver", select: "name" }]);
      // Emit the full document so clients can flatten it correctly
      if (receiverSocketId) {
        req.io.to(receiverSocketId).emit("personalChat:newMessage", msg);
      }
      if (senderSocketId) {
        req.io.to(senderSocketId).emit("personalChat:newMessage", msg);
      }
      // Return the last added message subdocument for the optimistic update
      const addedMessage = msg.message[msg.message.length - 1];
      return res.status(200).json(new ApiResponse(200, { messageId: addedMessage._id }, "Message sent!"));
    }
    msg = await ChatMessage.create({ sender: senderId, receiver: receiverId, message: [messageEntry] });
    await msg.populate([{ path: "sender", select: "name" }, { path: "receiver", select: "name" }]);
    if (receiverSocketId) {
      req.io.to(receiverSocketId).emit("personalChat:newMessage", msg);
    }
    if (senderSocketId) {
      req.io.to(senderSocketId).emit("personalChat:newMessage", msg);
    }
    const addedMessage = msg.message[msg.message.length - 1];
    return res.status(201).json(new ApiResponse(201, { messageId: addedMessage._id }, "Message sent!"));
  } catch (err) {
    logger.error("Error at send message: ", err?.message || err);
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
          const msgSenderId = m.senderId ? m.senderId.toString() : (senderId === userId ? receiverId : senderId);
          if (msgSenderId !== userId && m.isRead === false) {
            unreadCount++;
          }
        }

        // For E2EE previews, hand the viewer the copy they can decrypt:
        // toSender for their own message, toReceiver for an incoming one.
        const lastMsgSenderId = lastMsg?.senderId
          ? lastMsg.senderId.toString()
          : (senderId === userId ? receiverId : senderId);
        const isMyLastMessage = lastMsgSenderId === userId;
        const previewCipher = lastMsg?.encrypted
          ? (isMyLastMessage ? lastMsg?.ciphertexts?.toSender : lastMsg?.ciphertexts?.toReceiver) || null
          : null;

        conversationMap.set(otherUserId, {
          user: {
            _id: otherUserId,
            name: otherUser.name,
            email: otherUser.email,
          },
          // Legacy plaintext preview — empty for E2EE messages.
          lastMessage: lastMsg?.text || "",
          // E2EE preview: ciphertext the client can decrypt with its own key.
          lastMessageCipher: previewCipher,
          lastMessageEncrypted: Boolean(lastMsg?.encrypted),
          // Direction flag: true when the last message was sent by the viewer
          // (preview copy is toSender → decrypt with MY own public key).
          lastMessageMine: isMyLastMessage,
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