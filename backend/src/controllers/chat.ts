import { ObjectId } from "mongodb";

import db, { Chat } from "../data/db";
import chatgpt from "../data/chatgpt";
import { Controller } from "../data/api";
import { BadRequestError, InternalServerError } from "../errors";

const SYSTEM_PROMPT = `
From now on, you will assume the role of a professional digital marketing advisor under the company called JXW Asia.
You will only discuss about marketing related questions.
Please do not entertain non-marketing related questions.
`;

export class ChatController extends Controller {
  // Create a new chats
  async create(message: string) {
    // Ensure valid message
    if (!message.trim()) {
      throw new BadRequestError(
        "Please provide a valid message",
        "invalid_message"
      );
    }

    // Ensure valid user
    const userId = this.session.getUserIdOrThrow();

    // Call chat completion
    //
    // For first message, we will interject a system message to request
    // ChatGPT to reply NO if message is not related to marketing
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
    const result = await chatgpt.chatComplete(messages);
    messages.push({
      date: new Date(result.created * 1000),
      role: result.choices.length
        ? result.choices[0].message.role
        : "assistant",
      content: result.choices.length
        ? result.choices[0].message.content || ""
        : "",
      result,
    });

    // Insert doc
    const { insertedId } = await db.chats.insertOne({
      createdAt: now,
      updatedAt: now,
      userId,
      status: "idle",
      messages,
    });

    // Get the inserted doc
    const chat = await db.chats.findOne({ _id: insertedId });
    if (!chat) {
      throw new InternalServerError();
    }

    return {
      ...chat,

      // Convert to string
      _id: chat._id.toHexString(),

      // Filter away system messages
      messages: chat.messages.filter((message) => message.role !== "system"),
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
      data: chats.map((chat) => ({
        ...chat,

        // Convert to string
        _id: chat._id.toHexString(),

        // Filter away system messages
        messages: chat.messages.filter((message) => message.role !== "system"),
      })),
      count: chats.length,
    };
  }

  // Update chat with new message
  async update(chatId: string, message: string) {
    // Ensure valid message
    if (!message.trim()) {
      throw new BadRequestError(
        "Please provide a valid message",
        "invalid_message"
      );
    }

    // Ensure valid user
    const userId = this.session.getUserIdOrThrow();

    // Ensure valid chat id
    let chat = await db.chats.findOne({
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
    const messages = chat.messages.map((message) => ({
      date: message.date,
      role: message.role,
      content: message.content,
    }));
    messages.push({
      date: new Date(),
      role: "user",
      content: message,
    });
    const result = await chatgpt.chatComplete(messages);
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
        },
        $push: {
          messages: {
            $each: [messages[messages.length - 1], resultMessage],
          },
        },
      }
    );
    if (updateResult.modifiedCount !== 1) {
      throw new InternalServerError();
    }

    // Get the updated doc
    chat = await db.chats.findOne({ _id: new ObjectId(chatId) });
    if (!chat) {
      throw new InternalServerError();
    }

    return {
      ...chat,

      // Convert to string
      _id: chat._id.toHexString(),

      // Filter away system messages
      messages: chat.messages.filter((message) => message.role !== "system"),
    };
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
}
