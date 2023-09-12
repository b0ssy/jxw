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
Do not offer any information about non-marketing related questions.
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

      messages: [
        {
          date: now,
          role: "user",
          content: message,
        },
      ],
    };
    const { insertedId } = await db.chats.insertOne(chat);

    const postprocessedChat = this.postprocessChat({
      ...chat,
      _id: insertedId,
    });

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
      .chatComplete(chat._id.toHexString(), [
        ...chat.messages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
      ])
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
    //
    // Note: The document might be deleted while the response is still streaming in
    //       For now, it doesn't matter and we can safely ignore
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
        $push: {
          messages: resultMessage,
        },
      }
    );
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
