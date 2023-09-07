import { z } from "zod";

import { ENV } from "../config";

// config
export const zConfig = z.object({
  id: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  key: z.enum([""]),
  value: z.string().nullish(),
});
export type Config = z.infer<typeof zConfig>;

// event_log
export const zEventLog = z.object({
  id: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  type: z.enum([""]),
  dataId: z.string().nullish(),
  sessionUserId: z.string().nullish(),
  data: z.string().nullish(),
});
export type EventLog = z.infer<typeof zEventLog>;

// Manage MongoDB
export class Database {
  // TODO
  shutdown() {}
}

export default new Database();
