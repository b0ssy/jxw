import OpenAI from "openai";

import chatServer from "./chat-server";
import { ENV } from "../config";

// Default GPT model to use
export const MODEL = "gpt-3.5-turbo";

// Number of chunks to send in a batch
export const SEND_CHUNK_BATCH_COUNT = 5;

// Delay interval between batch of chunks in milliseconds
export const CHUNK_BATCH_INTERVAL_DELAY_MILLISECONDS = 250;

export type ChatGPTMessage = {
  role: "user" | "assistant" | "system" | "function";
  content: string;
};

export type ChatGPTOptions = {
  apiKey: string;
};

// A simple wrapper over OpenAI chat API
export class ChatGPT {
  openai: OpenAI;

  constructor(options: ChatGPTOptions) {
    this.openai = new OpenAI({ apiKey: options.apiKey });
  }

  chatComplete = async (
    chatId: string,
    messages: ChatGPTMessage[],
    model = MODEL
  ) => {
    const stream = await this.openai.chat.completions.create({
      messages,
      model,
      stream: true,
      temperature: 0.2,
    });

    // Read chunk by chunk and emit to clients
    const contents: string[] = [];
    let result: {
      id: string;
      created: number;
      model: string;
    } | null = null;
    for await (const chunk of stream) {
      if (!result) {
        result = {
          id: chunk.id,
          created: chunk.created,
          model: chunk.model,
        };
      }
      if (chunk.choices.length && chunk.choices[0].delta.content) {
        contents.push(chunk.choices[0].delta.content);

        // Emit contents every X chunks
        // For now, emit the full content
        if (contents.length % SEND_CHUNK_BATCH_COUNT === 0) {
          chatServer.broadcast(chatId, {
            type: "chat_content",
            data: contents.join(""),
          });
          await new Promise<void>((resolve) => {
            setTimeout(() => {
              resolve();
            }, CHUNK_BATCH_INTERVAL_DELAY_MILLISECONDS);
          });
        }
      }
    }
    if (!result) {
      return null;
    }

    // Emit the full content at the end
    if (contents.length % SEND_CHUNK_BATCH_COUNT !== 0) {
      chatServer.broadcast(chatId, {
        type: "chat_content",
        data: contents.join(""),
      });
    }
    // Indicate no more content
    chatServer.broadcast(chatId, {
      type: "chat_content_end",
    });

    return {
      ...result,
      object: "chat.completion",
      choices: [
        {
          index: 0,
          finish_reason: "stop",
          message: {
            role: "assistant",
            content: contents.join(""),
          },
        },
      ],
    } as const;
  };
}

export default new ChatGPT({ apiKey: ENV.OPENAI_API_KEY });
