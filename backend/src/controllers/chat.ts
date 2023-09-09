import { ObjectId, WithId } from "mongodb";

import db, { Chat } from "../data/db";
import chatgpt from "../data/chatgpt";
import chatServer from "../data/chat-server";
import { Controller } from "../data/api";
import { Logger } from "../helpers/logger";
import { BadRequestError, InternalServerError } from "../errors";

const LOG = new Logger("controllers/chat");

const SYSTEM_PROMPT = `
From now on, you will assume the role of a professional digital marketing advisor under the company called JXW Asia.
You will only discuss about marketing related questions.
Please do not entertain non-marketing related questions.
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

    // For first message, we will interject a system message to request
    // ChatGPT to only talk about marketing related conversations
    const now = new Date();
    const messages: Chat["messages"] = [
      {
        date: now,
        role: "user",
        content: message,
      },
      {
        date: now,
        role: "system",
        content: SYSTEM_PROMPT,
      },
    ];

    // Insert doc
    const { insertedId } = await db.chats.insertOne({
      createdAt: now,
      updatedAt: now,
      userId,
      status: "running",
      messages,
    });

    // Get the inserted doc
    const chat = await db.chats.findOne({ _id: insertedId });
    if (!chat) {
      throw new InternalServerError();
    }
    const postprocessedChat = this.postprocessChat(chat);

    // Send updated doc
    chatServer.broadcast(insertedId.toHexString(), {
      type: "chat",
      data: postprocessedChat,
    });

    // Call ChatGPT in the background
    this._callChatGPT(insertedId.toHexString());

    return postprocessedChat;
  }

  // Get one chat
  async get(chatId: string) {
    // Ensure valid user
    const userId = this.session.getUserIdOrThrow();

    // Get the inserted doc
    const chat = await db.chats.findOne({
      _id: new ObjectId(chatId),
      userId,
    });
    if (!chat) {
      throw new InternalServerError();
    }

    return this.postprocessChat(chat);
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
      data: chats.map((chat) => this.postprocessChat(chat)),
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

    // Push new message
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
        $push: {
          messages: {
            date: now,
            role: "user",
            content: message,
          },
        },
      }
    );
    if (updateResult.modifiedCount !== 1) {
      throw new BadRequestError();
    }

    // Get the updated doc
    const chat = await db.chats.findOne({ _id: new ObjectId(chatId) });
    if (!chat) {
      throw new InternalServerError();
    }
    const postprocessedChat = this.postprocessChat(chat);

    // Send updated doc
    chatServer.broadcast(chatId, {
      type: "chat",
      data: postprocessedChat,
    });

    // Call ChatGPT in the background
    this._callChatGPT(chatId);

    return postprocessedChat;
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

    // Ensure valid chat id
    const chat = await db.chats.findOne({
      _id: new ObjectId(chatId),
      userId,
    });
    if (!chat) {
      throw new BadRequestError(
        "Please provide a valid chat id",
        "invalid_chat_id"
      );
    }

    // Call chat completion
    const result = await chatgpt
      .chatComplete(
        chat._id.toHexString(),
        chat.messages.map((message) => ({
          role: message.role,
          content: message.content,
        }))
      )
      .catch((err) => {
        LOG.error("ChatGPT chat completion error", {
          message: err?.message ?? "",
          stack: err?.stack ?? "",
        });
        return null;
      });
    // Error occured, update status back to idle
    if (!result) {
      await db.chats.updateOne(
        {
          _id: chat._id,
          userId,
        },
        {
          $set: {
            updatedAt: new Date(),
            status: "idle",
          },
        }
      );
      return;
    }

    const resultMessage: Chat["messages"][0] = {
      date: new Date(result.created * 1000),
      role: result.choices.length
        ? result.choices[0].message.role
        : "assistant",
      content: result.choices.length
        ? result.choices[0].message.content || ""
        : "",
      result,
    };

    // Update doc
    const updateResult = await db.chats.updateOne(
      {
        _id: chat._id,
        userId,
      },
      {
        $set: {
          updatedAt: new Date(),
          status: "idle",
        },
        $push: {
          messages: resultMessage,
        },
      }
    );
    if (updateResult.modifiedCount !== 1) {
      throw new InternalServerError();
    }
  }

  // Post process chat document
  // - Convert _id to hex string
  // - Remove system messages
  postprocessChat(chat: WithId<Chat>) {
    return {
      ...chat,

      // Convert to string
      _id: chat._id.toHexString(),

      // Filter away system messages
      messages: chat.messages.filter((message) => message.role !== "system"),
    };
  }
}
