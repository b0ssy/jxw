import OpenAI from "openai";

import { ENV } from "../config";

const MODEL = "gpt-3.5-turbo";

export type ChatGPTMessage = {
  role: "user" | "assistant" | "system" | "function";
  content: string;
};

export type ChatGPTOptions = {
  apiKey: string;
};

export class ChatGPT {
  openai: OpenAI;

  constructor(options: ChatGPTOptions) {
    this.openai = new OpenAI({ apiKey: options.apiKey });
  }

  chatComplete = async (messages: ChatGPTMessage[], model = MODEL) => {
    const result = await this.openai.chat.completions.create({
      messages,
      model,
    });
    return result;
  };
}

export default new ChatGPT({ apiKey: ENV.OPENAI_API_KEY });