import { WebSocket, WebSocketServer } from "ws";
import { IncomingMessage, Server } from "http";
import { ObjectId } from "mongodb";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

import db from "./db";
import { Session, decodeJWTPayload } from "./session";
import { BadRequestError, NotAuthorizedError } from "../errors";
import { ChatController } from "../controllers/chat";

// Path to websocket server
export const CHAT_PATH = "/chat";

// Websocket server events
export const zChatServerEvent = z.discriminatedUnion("type", [
  // Latest chat response from ChatGPT
  z.object({
    type: z.literal("chat_content"),
    data: z.string(),
  }),
  // Indicates that chat content has ended
  z.object({
    type: z.literal("chat_content_end"),
  }),
]);
export type ChatServerEvent = z.infer<typeof zChatServerEvent>;

export type ChatServerOptions = {};

// A chat websocket server for emitting ChatGPT responses in real-time
export class ChatServer {
  options: ChatServerOptions;
  server: WebSocketServer;

  // Client connections mapped by chat id
  clients: { [k: string]: Client[] } = {};

  constructor(options: ChatServerOptions) {
    this.options = options;

    this.server = new WebSocketServer({
      noServer: true,
      path: CHAT_PATH,
    });
    this.server.on("connection", (connection, request) => {
      this.handleConnection(connection, request);
    });
  }

  // Connect to existing HTTP server
  connect(httpServer: Server) {
    httpServer.on("upgrade", (request, socket, head) => {
      this.server.handleUpgrade(request, socket, head, (websocket) => {
        this.server.emit("connection", websocket, request);
      });
    });
  }

  // Broadcast event to all clients associated with chat id
  // NOTE: This function is not horizontally scalable yet
  async broadcast(chatId: string, event: ChatServerEvent) {
    const clients = this.clients[chatId] || [];
    for (const client of clients) {
      this.sendServerEvent(client, event);
    }
  }

  // Handle an incoming connection
  private async handleConnection(
    connection: WebSocket,
    request: IncomingMessage
  ) {
    try {
      // Ensure valid url
      if (!request.url) {
        throw new BadRequestError("Please provide a valid URL", "invalid_url");
      }

      // Parse url
      const url = new URL(`ws://127.0.0.1:${request.url}`);

      // Get chat id
      const chatId = url.searchParams.get("id");
      if (!chatId) {
        throw new BadRequestError(
          "Please provide a valid chat id",
          "invalid_chat_id"
        );
      }

      // Authenticate user
      const accessToken = url.searchParams.get("token");
      if (!accessToken) {
        throw new NotAuthorizedError(
          "Please provide a valid token",
          "invalid_token"
        );
      }
      const jwtPayload = decodeJWTPayload(accessToken);

      // Ensure chat belongs to user
      const count = await db.chats.countDocuments({
        _id: new ObjectId(chatId),
        userId: jwtPayload.userId,
      });
      if (count <= 0) {
        throw new NotAuthorizedError(
          "Please provide a valid chat id",
          "invalid_chat_id"
        );
      }

      // Connection state might change here
      // So if it turned to closing/closed, then no point continue
      if (
        connection.readyState === WebSocket.CLOSING ||
        connection.readyState === WebSocket.CLOSED
      ) {
        return;
      }

      // Generate a unique ID for this client connection
      const connectionId = uuidv4();

      // Create and store client connection
      const session = new Session({ accessToken, jwtPayload });
      const chatController = new ChatController({ session });
      const client: Client = {
        connectionId,
        connection,
        session,
        chatId,
        chatController,
      };
      this.clients[chatId] = this.clients[chatId] || [];
      this.clients[chatId].push(client);

      // Remove client connection on close
      connection.on("close", () => {
        if (!this.clients[chatId]) {
          return;
        }
        // Find and remove client connection by its ID
        for (let i = 0; i < this.clients[chatId].length; i++) {
          if (this.clients[chatId][i].connectionId === connectionId) {
            this.clients[chatId].splice(i, 1);
            if (!this.clients[chatId].length) {
              delete this.clients[chatId];
            }
            break;
          }
        }
      });
    } catch (err) {
      // Close connection on any errors
      connection.close();
    }
  }

  // Send event to a client
  private async sendServerEvent(client: Client, event: ChatServerEvent) {
    client.connection.send(JSON.stringify(event));
  }
}

// Represents a client connection
export type Client = {
  connectionId: string;
  connection: WebSocket;
  session: Session;
  chatId: string;
  chatController: ChatController;
};

export default new ChatServer({});
