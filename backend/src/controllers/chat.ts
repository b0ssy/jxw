import { ObjectId } from "mongodb";

import db, { Chat } from "../data/db";
import chatgpt from "../data/chatgpt";
import { Controller } from "../data/api";
import { BadRequestError, InternalServerError } from "../errors";

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
    const messages: Chat["messages"] = [
      {
        role: "user",
        content: message,
      },
      {
        role: "system",
        content: "Reply NO if not marketing related",
      },
    ];
    const result = await chatgpt.chatComplete(messages);
    messages.push({
      role: result.choices.length
        ? result.choices[0].message.role
        : "assistant",
      content: result.choices.length
        ? result.choices[0].message.content || ""
        : "",
      result,
    });

    // Insert doc
    const now = new Date();
    const { insertedId } = await db.chats.insertOne({
      createdAt: now,
      updatedAt: now,
      userId,
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
    const chats = await db.chats.find({ userId }).toArray();

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
    const result = await chatgpt.chatComplete(chat.messages);
    const newMessage: Chat["messages"][0] = {
      role: result.choices.length
        ? result.choices[0].message.role
        : "assistant",
      content: result.choices.length
        ? result.choices[0].message.content || ""
        : "",
      result,
    };

    // Update doc
    const now = new Date();
    const updateResult = await db.chats.updateOne(
      {
        _id: chat._id,
        userId,
      },
      {
        updatedAt: now,
        $push: {
          messages: newMessage,
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
