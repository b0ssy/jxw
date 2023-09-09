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

// Request header with chat id
export const CHAT_ID_HEADER = "x-chat-id";

export const zServerEvent = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("chat"),
    data: zChat.extend({ _id: z.string() }),
  }),
  z.object({
    type: z.literal("chat_content"),
    data: z.string(),
  }),
]);
export type ServerEvent = z.infer<typeof zServerEvent>;

export type ChatServerOptions = {};

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

  async broadcastChatContent(chatId: string, content: string) {
    const clients = this.clients[chatId] || [];
    for (const client of clients) {
      this.sendServerEvent(client, { type: "chat_content", data: content });
    }
  }

  private async handleConnection(
    connection: WebSocket,
    request: IncomingMessage
  ) {
    try {
      // Get chat id
      const chatId = request.headers[CHAT_ID_HEADER];
      if (typeof chatId !== "string" || !chatId) {
        throw new BadRequestError(
          `Please provide a valid chat id via "${CHAT_ID_HEADER}" header`,
          "invalid_chat_id"
        );
      }

      // Authenticate user
      const authorization = request.headers.authorization;
      if (!authorization?.startsWith("Bearer ")) {
        throw new NotAuthorizedError(
          "Please provide a valid access token",
          "invalid_access_token"
        );
      }
      const accessToken = authorization.slice("Bearer ".length);
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
      console.log(err);
      connection.close();
    }
  }

  private async sendServerEvent(client: Client, event: ServerEvent) {
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
