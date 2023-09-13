import { z } from "zod";

export const zMessage = z.object({
  createdAt: z.date(),
  updatedAt: z.date(),
  userId: z.string(),
  chatId: z.string(),
  role: z.enum(["user", "assistant", "system", "function"]),
  content: z.string(),
  result: z.any().nullish(),
});
export type Message = z.infer<typeof zMessage>;
