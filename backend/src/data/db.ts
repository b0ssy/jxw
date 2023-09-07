import { MongoClient, ServerApiVersion } from "mongodb";
import { z } from "zod";

import { ENV } from "../config";

// users
export const zUser = z.object({
  createdAt: z.date(),
  updatedAt: z.date(),
  email: z.string().optional(),
  passwordHash: z.string().optional(),
});
export type User = z.infer<typeof zUser>;

// chats
export const zChat = z.object({
  createdAt: z.date(),
  userId: z.string(),
  messages: z.object({}).array(),
});
export type Chat = z.infer<typeof zChat>;

// Manage MongoDB
export class Database {
  client: MongoClient;

  constructor() {
    this.client = new MongoClient(ENV.MONGODB_URI, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
    });
  }

  async connect() {
    await this.client.connect();
  }

  async close() {
    await this.client.close();
  }

  get users() {
    return this._db().collection<User>("users");
  }

  get chats() {
    return this._db().collection<Chat>("chats");
  }

  _db() {
    return this.client.db();
  }
}

export default new Database();
