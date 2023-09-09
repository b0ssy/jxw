import { w3cwebsocket as WebSocketClient } from "websocket";
import { z } from "zod";

import { ENV } from "../config";

// Reconnect websocket in milliseconds
export const WEBSOCKET_RECONNECT_TIMEOUT_MILLISECONDS = 1000;

// Websocket server events
export const zChatServerEvent = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("chat"),
    data: z.object({
      _id: z.string(),
      createdAt: z.string(),
      updatedAt: z.string(),
      userId: z.string(),
      status: z.enum(["idle", "running"]),
      messages: z
        .object({
          date: z.string(),
          role: z.enum(["user", "assistant", "system", "function"]),
          content: z.string(),
          result: z.any().nullish(),
        })
        .array(),
    }),
  }),
  z.object({
    type: z.literal("chat_content"),
    data: z.string(),
  }),
  z.object({
    type: z.literal("chat_content_end"),
  }),
]);
export type ChatServerEvent = z.infer<typeof zChatServerEvent>;

// ChatClient options
export type ChatClientOptions = {
  accessToken: string;
  chatId: string;
  onReceive: (event: ChatServerEvent) => void;
};

// Chat websocket client to talk to backend chat websocket server
export class ChatClient {
  options: ChatClientOptions;
  socket: WebSocketClient | null = null;
  isOpen = false;

  constructor(options: ChatClientOptions) {
    this.options = options;
  }

  // Open client websocket connection
  connect() {
    const { host } = new URL(ENV.VITE_PROXY_BACKEND);
    this.socket = new WebSocketClient(
      `${ENV.DEV ? "ws" : "wss"}://${host}/chat?token=${
        this.options.accessToken
      }&id=${this.options.chatId}`
    );

    // Handle socket connection closed
    this.socket.onclose = () => {
      // If socket connection closed unexpectedly, then reconnect
      if (this.isOpen) {
        setTimeout(() => {
          // Check isOpen again because it may be set to false after timeout
          if (this.isOpen) {
            console.log("Reconnecting...");
            this.connect();
          }
        }, WEBSOCKET_RECONNECT_TIMEOUT_MILLISECONDS);
      }
    };

    // Handle errors
    this.socket.onerror = (err) => {
      console.error(`socket error: ${err}`);
    };

    // Handle incoming messages
    this.socket.onmessage = (message) => {
      // Ensure valid message
      if (typeof message.data !== "string") {
        return;
      }

      // Parse message
      const data = zChatServerEvent.safeParse(JSON.parse(message.data));
      if (!data.success) {
        console.error("Failed to parse message");
        return;
      }

      // Trigger callback
      this.options.onReceive(data.data);
    };

    this.isOpen = true;
  }

  close() {
    this.isOpen = false;
    this.socket?.close();
    this.socket = null;
  }
}
