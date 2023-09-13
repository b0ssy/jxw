import { z } from "zod";

export const zChat = z.object({
  createdAt: z.date(),
  updatedAt: z.date(),
  userId: z.string(),
  status: z.enum(["idle", "running"]),
  summary: z.string(),
});
export type Chat = z.infer<typeof zChat>;
