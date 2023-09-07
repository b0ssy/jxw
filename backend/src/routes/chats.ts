import { z } from "zod";

import { Routes } from "../data";
import { ChatController } from "../controllers/chat";

const routes = new Routes({
  createController: () => new ChatController(),
})
  .post("/chats", "Create chat", {
    tags: ["Chat"],
    req: z.object({
      body: z.object({
        message: z.string(),
      }),
    }),
    resSuccessBody: z.object({
      chatId: z.string(),
    }),
    handler: async ({ ctl, body }) => {
      const { chatId } = await ctl.create(body.message);
      return { chatId };
    },
  })
  .post("/chats/{id}/message", "Add chat message", {
    tags: ["Chat"],
    req: z.object({
      body: z.object({
        message: z.string(),
      }),
    }),
    resSuccessBody: z.object({
      chatId: z.string(),
    }),
    handler: async ({ ctl, body }) => {
      await ctl.update(body.message);
    },
  })
  .delete("/chats", "Delete chat", {
    tags: ["Chat"],
    req: z.object({
      body: z.object({
        chatId: z.string(),
      }),
    }),
    resSuccessBody: z.object({}),
    handler: async ({ ctl, body }) => {
      await ctl.delete(body.chatId);
    },
  });

export default routes.router;
