import { z } from "zod";

import { Routes } from "../../data";
import { AuthController } from "../../controllers/auth";

const routes = new Routes({
  createController: () => new AuthController(),
}).post("/v1/login", "Login account", {
  tags: ["Auth"],
  req: z.object({
    body: z.object({
      email: z.string(),
      password: z.string(),
    }),
  }),
  resSuccessBody: z.object({
    userId: z.string(),
    accessToken: z.string(),
  }),
  handler: async ({ ctl, body }) => {
    const { userId, accessToken } = await ctl.login(body.email, body.password);
    return { userId, accessToken };
  },
});

export default routes.router;
