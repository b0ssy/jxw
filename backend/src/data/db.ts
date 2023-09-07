import { MongoClient, ServerApiVersion } from "mongodb";
import { z } from "zod";

import { ENV } from "../config";
import { Logger } from "../helpers/logger";

const LOG = new Logger("data/db");

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
    LOG.info("Connected to MongoDB successfully");

    // Automatically create indexes for convenience sake
    await this.createIndexes();
  }

  async createIndexes() {
    await this.users.createIndex({ email: 1 }, { unique: true });
  }

  async close() {
    await this.client.close();
    LOG.info("Closed MongoDB connection successfully");
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
