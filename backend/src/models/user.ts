import { z } from "zod";

export const zUser = z.object({
  createdAt: z.date(),
  updatedAt: z.date(),
  email: z.string().nullish(),
  passwordHash: z.string().nullish(),
});
export type User = z.infer<typeof zUser>;
