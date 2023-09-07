import { z } from "zod";

import { Routes } from "../../data";
import { ChatController } from "../../controllers/chat";

const routes = new Routes({
  createController: () => new ChatController(),
})
  .post("/v1/chats", "Create chat", {
    tags: ["Chat"],
    req: z.object({}),
    resSuccessBody: z.object({
      id: z.string(),
    }),
    handler: async ({ ctl, body }) => {
      const { _id } = await ctl.create();
      return { id: _id.toHexString() };
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
    resSuccessBody: z.object({}),
    handler: async ({ ctl, body, params }) => {
      await ctl.update(params.id, body.message);
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
