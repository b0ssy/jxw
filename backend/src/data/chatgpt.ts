import OpenAI from "openai";

import chatServer from "./chat-server";
import { ENV } from "../config";

// Default GPT model to use
const MODEL = "gpt-3.5-turbo";

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

        // Emit contents every 10 chunks
        // For now, emit the full content
        if (contents.length % 10 === 0) {
          chatServer.broadcastChatContent(chatId, contents.join(""));
        }
      }
    }
    if (!result) {
      return null;
    }

    // Emit the full content at the end
    if (contents.length % 10 !== 0) {
      chatServer.broadcastChatContent(chatId, contents.join(""));
    }

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
