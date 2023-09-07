import { ObjectId } from "mongodb";

import { db } from "../data";
import { Controller } from "../data/api";

export class ChatController extends Controller {
  async create() {
    const createdAt = new Date();
    const userId = this.session.getUserIdOrThrow();
    const { insertedId } = await db.chats.insertOne({
      createdAt,
      userId,
      messages: [],
    });
    return { _id: insertedId };
  }

  // TODO
  async update(chatId: string, message: string) {}

  async delete(chatId: string) {
    const userId = this.session.getUserIdOrThrow();
    await db.chats.deleteOne({
      _id: new ObjectId(chatId),
      userId,
    });
  }
}
