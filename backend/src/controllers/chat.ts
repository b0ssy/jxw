import { ObjectId, WithId } from "mongodb";

import db, { Chat, Message } from "../data/db";
import chatgpt from "../data/chatgpt";
import { Controller } from "../data/api";
import { Logger } from "../helpers/logger";
import { BadRequestError, InternalServerError } from "../errors";

const LOG = new Logger("controllers/chat");

const SYSTEM_PROMPT = `
You are a professional digital marketing assistant.

Please analyze each query and determine if it is marketing related.

You will answer the query if it is directly related to marketing or it follows on from the previous query.
Otherwise, please do not provide any answer, even if the query is repeatedly asked.
`;

export class ChatController extends Controller {
  // Create a new chat
  async create(message: string) {
    // Ensure valid message
    message = message.trim();
    if (!message) {
      throw new BadRequestError(
        "Please provide a valid message",
        "invalid_message"
      );
    }

    // Ensure valid user
    const userId = this.session.getUserIdOrThrow();

    // Create chat doc
    const now = new Date();
    const chat: Chat = {
      createdAt: now,
      updatedAt: now,
      userId,
      status: "running",

      // Store the first user message as the summary text
      summary: message,
    };
    const { insertedId } = await db.chats.insertOne(chat);
    const chatId = insertedId.toHexString();

    // Create message doc
    await db.messages.insertOne({
      createdAt: now,
      updatedAt: now,
      userId,
      chatId,
      role: "user",
      content: message,
    });

    // Call ChatGPT in the background
    this._callChatGPT(chatId);

    return { ...chat, _id: chatId };
  }

  // Get one chat
  async get(chatId: string) {
    // Ensure valid user
    const userId = this.session.getUserIdOrThrow();

    // Get chat doc
    const chat = await db.chats.findOne({
      _id: new ObjectId(chatId),
      userId,
    });
    if (!chat) {
      throw new InternalServerError();
    }

    return { ...chat, _id: chat._id.toHexString() };
  }

  // Get chat messages
  async getMessages(chatId: string) {
    // Ensure valid user
    const userId = this.session.getUserIdOrThrow();

    // Get messages
    const messages = await db.messages
      .find({ userId, chatId })
      .sort({ createdAt: 1 })
      .toArray();

    return {
      data: messages.map((message) => ({
        ...message,
        _id: message._id.toHexString(),
      })),
      count: messages.length,
    };
  }

  // List all chats
  async list() {
    // Ensure valid user
    const userId = this.session.getUserIdOrThrow();

    // Get all chats
    const chats = await db.chats
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray();

    return {
      data: chats.map((chat) => ({ ...chat, _id: chat._id.toHexString() })),
      count: chats.length,
    };
  }

  // Update chat with new message
  async update(chatId: string, message: string) {
    // Ensure valid message
    message = message.trim();
    if (!message) {
      throw new BadRequestError(
        "Please provide a valid message",
        "invalid_message"
      );
    }

    // Ensure valid user
    const userId = this.session.getUserIdOrThrow();

    // Update chat "status" to "running"
    const now = new Date();
    const updateResult = await db.chats.updateOne(
      {
        _id: new ObjectId(chatId),
        userId,
        status: "idle",
      },
      {
        $set: {
          updatedAt: now,
          status: "running",
        },
      }
    );
    if (updateResult.modifiedCount !== 1) {
      throw new BadRequestError();
    }

    // Create message doc
    await db.messages.insertOne({
      createdAt: now,
      updatedAt: now,
      userId,
      chatId,
      role: "user",
      content: message,
    });

    // Call ChatGPT in the background
    this._callChatGPT(chatId);
  }

  // Delete chat
  async delete(chatId: string) {
    // Ensure valid user
    const userId = this.session.getUserIdOrThrow();

    // Delete doc
    const deleteResult = await db.chats.deleteOne({
      _id: new ObjectId(chatId),
      userId,
    });
    if (deleteResult.deletedCount !== 1) {
      throw new BadRequestError(
        "Please provide a valid chat id",
        "invalid_chat_id"
      );
    }
  }

  // Call ChatGPT
  async _callChatGPT(chatId: string) {
    // Ensure valid user
    const userId = this.session.getUserIdOrThrow();

    // Get all chat messages with created date sorted in ascending order
    const messages = await db.messages
      .find({ userId, chatId })
      .sort({ createdAt: 1 })
      .project<Pick<Message, "role" | "content">>({
        _id: 0,
        role: 1,
        content: 1,
      })
      .toArray();
    if (!messages.length) {
      throw new BadRequestError(
        "Please provide a valid chat id",
        "invalid_chat_id"
      );
    }
    // Insert system prompt at the front
    messages.unshift({
      role: "system",
      content: SYSTEM_PROMPT,
    });

    // Call chat completion
    const result = await chatgpt.chatComplete(chatId, messages).catch((err) => {
      LOG.error("ChatGPT chat completion error", {
        message: err?.message ?? "",
        stack: err?.stack ?? "",
      });
      return null;
    });``

    // Update chat "status" back to "idle"
    const now = new Date();
    await db.chats.updateOne(
      {
        _id: new ObjectId(chatId),
        userId,
      },
      {
        $set: {
          updatedAt: now,
          status: "idle",
        },
      }
    );

    // Create result message doc
    // Note: If result is not available, we will create an empty message to denote something went wrong
    await db.messages.insertOne({
      createdAt: now,
      updatedAt: now,
      userId,
      chatId,
      role: result?.choices.length
        ? result.choices[0].message.role
        : "assistant",
      content: result?.choices.length
        ? result.choices[0].message.content || ""
        : "",
      result,
    });
  }

  // Post process chat document
  // - Convert _id to hex string
  // - Remove system messages
  postprocessChat(chat: WithId<Chat>) {
    return {
      ...chat,

      // Convert to string
      _id: chat._id.toHexString(),
    };
  }
}
