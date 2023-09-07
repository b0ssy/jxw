import { MongoClient, ServerApiVersion } from "mongodb";
import { z } from "zod";

import { ENV } from "../config";

// users
export const zUser = z.object({
  id: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  email: z.string(),
  passwordHash: z.string(),
});
export type User = z.infer<typeof zUser>;

// chats
export const zChat = z.object({
  id: z.string(),
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
}

export default new Database();
