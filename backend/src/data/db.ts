import { MongoClient, ServerApiVersion } from "mongodb";
import { z } from "zod";

import { ENV } from "../config";
import { Logger } from "../helpers/logger";

const LOG = new Logger("data/db");

// users
export const zUser = z.object({
  createdAt: z.date(),
  updatedAt: z.date(),
  email: z.string().nullish(),
  passwordHash: z.string().nullish(),
});
export type User = z.infer<typeof zUser>;

// chats
export const zChat = z.object({
  createdAt: z.date(),
  updatedAt: z.date(),
  userId: z.string(),
  messages: z
    .object({
      role: z.enum(["user", "assistant", "system", "function"]),
      content: z.string(),
      result: z.any().nullish(),
    })
    .array(),
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

  // Connect to database
  async connect() {
    await this.client.connect();
    LOG.info("Connected to MongoDB successfully");

    // Automatically create indexes for convenience sake
    await this.createIndexes();
  }

  // Create indexes
  async createIndexes() {
    // users
    await this.users.createIndex({ email: 1 }, { unique: true });

    // chats
    await this.chats.createIndex({ _id: 1, userId: 1 });
  }

  // Close database connection
  async close() {
    await this.client.close();
    LOG.info("Closed MongoDB connection successfully");
  }

  // Get handle to "users" collection
  get users() {
    return this._db().collection<User>("users");
  }

  // Get handle to "chats" collection
  get chats() {
    return this._db().collection<Chat>("chats");
  }

  // Get default database
  _db() {
    return this.client.db();
  }
}

export default new Database();
