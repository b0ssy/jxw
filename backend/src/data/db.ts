import { MongoClient, ServerApiVersion } from "mongodb";

import { ENV } from "../config";
import { User } from "../models/user";
import { Chat } from "../models/chat";
import { Message } from "../models/message";
import { Logger } from "../helpers/logger";

const LOG = new Logger("data/db");

// Database options
export type DatabaseOptions = {
  uri: string;
};

// Manage MongoDB
export class Database {
  private options: DatabaseOptions;
  private client: MongoClient | null = null;

  constructor(options: DatabaseOptions) {
    this.options = options;
  }

  // Connect to database
  async connect() {
    LOG.info("Connecting to MongoDB...");

    // Warn if database connection is already opened
    if (this.client) {
      LOG.warn("Already connected to MongoDB");
      return;
    }

    this.client = new MongoClient(this.options.uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
    });
    await this.client.connect();
    LOG.info("Connected to MongoDB successfully");

    // Automatically create indexes for convenience sake
    await this.createIndexes();
  }

  // Create indexes
  async createIndexes() {
    // Indexes for "users" collection
    //
    // Ensure email is unique
    await this.users.createIndex({ email: 1 }, { unique: true });

    // Indexes for "chats" collection
    //
    // Needs to filter by both _id and userId to ensure user has access
    await this.chats.createIndex({ _id: 1, userId: 1 });
    // Sort by created date
    await this.messages.createIndex({ createdAt: 1 });

    // Indexes for "messages" collection
    //
    // Filter messages by user id, chat id and role
    await this.messages.createIndex({ userId: 1, chatId: 1, role: 1 });
    // Sort by created date
    await this.messages.createIndex({ createdAt: 1 });
  }

  // Close database connection
  async close() {
    // Database connection is not opened yet
    if (!this.client) {
      return;
    }

    LOG.info("Closing MongoDB connection...");
    await this.client.close();
    this.client = null;
    LOG.info("Closed MongoDB connection successfully");
  }

  // Get handle to "users" collection
  get users() {
    return this.mainDb().collection<User>("users");
  }

  // Get handle to "chats" collection
  get chats() {
    return this.mainDb().collection<Chat>("chats");
  }

  // Get handle to "messages" collection
  get messages() {
    return this.mainDb().collection<Message>("messages");
  }

  // Get handle to main database
  private mainDb() {
    // This function asserts "client" is valid
    // Otherwise, DX suffers due to conditional checks when using it
    return this.client!.db();
  }
}

export default new Database({ uri: ENV.MONGODB_URI });
