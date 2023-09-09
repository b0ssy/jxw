import { WebSocket, WebSocketServer } from "ws";
import { IncomingMessage, Server } from "http";
import { ObjectId } from "mongodb";
import { z } from "zod";

import db, { zChat } from "./db";
import { Session, decodeJWTPayload } from "./session";
import { BadRequestError, NotAuthorizedError } from "../errors";
import { ChatController } from "../controllers/chat";

// Path to websocket server
export const CHAT_PATH = "/chat";

// Websocket server events
export const zChatServerEvent = z.discriminatedUnion("type", [
  // Full chat document
  z.object({
    type: z.literal("chat"),
    data: zChat.extend({ _id: z.string() }),
  }),
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

  connect(httpServer: Server) {
    httpServer.on("upgrade", (request, socket, head) => {
      this.server.handleUpgrade(request, socket, head, (websocket) => {
        this.server.emit("connection", websocket, request);
      });
    });
  }

  async broadcast(chatId: string, event: ChatServerEvent) {
    const clients = this.clients[chatId] || [];
    for (const client of clients) {
      this.sendServerEvent(client, event);
    }
  }

  private async handleConnection(
    connection: WebSocket,
    request: IncomingMessage
  ) {
    try {
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

      // Create and store client
      const session = new Session({ accessToken, jwtPayload });
      const chatController = new ChatController({ session });
      const client: Client = { connection, session, chatId, chatController };
      this.clients[chatId] = this.clients[chatId] || [];
      this.clients[chatId].push(client);

      // Send chat document
      const chat = await chatController.get(chatId);
      await this.sendServerEvent(client, { type: "chat", data: chat });
    } catch (err) {
      connection.close();
    }
  }

  private async sendServerEvent(client: Client, event: ChatServerEvent) {
    client.connection.send(JSON.stringify(event));
  }
}

export type Client = {
  connection: WebSocket;
  session: Session;
  chatId: string;
  chatController: ChatController;
};

export default new ChatServer({});
