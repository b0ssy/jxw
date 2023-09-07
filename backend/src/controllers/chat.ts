import { db } from "../data";
import { Controller } from "../data/api";

export class ChatController extends Controller {
  // TODO
  async create(message: string) {
    const chatId = "";
    return { chatId };
  }

  // TODO
  async update(chatId: string, message: string) {}

  // TODO
  async delete(chatId: string) {}
}
