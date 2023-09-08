import { z } from "zod";

import { Routes } from "../../data";
import { zChat } from "../../data/db";
import { ChatController } from "../../controllers/chat";

const routes = new Routes({
  createController: () => new ChatController(),
})
  .post("/v1/chats", "Create chat", {
    tags: ["Chat"],
    req: z.object({
      body: z.object({
        message: z.string(),
      }),
    }),
    resSuccessBody: zChat.extend({ _id: z.string() }),
    handler: async ({ ctl, body }) => {
      const data = await ctl.create(body.message);
      return data;
    },
  })
  .post("/v1/chats/{id}/message", "Create chat message", {
    tags: ["Chat"],
    req: z.object({
      body: z.object({
        message: z.string(),
      }),
      params: z.object({
        id: z.string(),
      }),
    }),
    resSuccessBody: zChat.extend({ _id: z.string() }),
    handler: async ({ ctl, body, params }) => {
      const data = await ctl.update(params.id, body.message);
      return data;
    },
  })
  .get("/v1/chats", "Get chats", {
    tags: ["Chat"],
    req: z.object({}),
    resSuccessBody: z.object({
      data: zChat.extend({ _id: z.string() }).array(),
      count: z.number(),
    }),
    handler: async ({ ctl }) => {
      const { data, count } = await ctl.list();
      return { data, count };
    },
  })
  .delete("/v1/chats/{id}", "Delete chat", {
    tags: ["Chat"],
    req: z.object({
      params: z.object({
        id: z.string(),
      }),
    }),
    resSuccessBody: z.object({}),
    handler: async ({ ctl, params }) => {
      await ctl.delete(params.id);
    },
  });

export default routes.router;
