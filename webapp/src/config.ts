import { z } from "zod";

// Type-safe parsing of environment variables

export const zEnv = z.object({
  BASE_URL: z.string(),
  DEV: z.boolean(),
  PROD: z.boolean(),
  SSR: z.boolean(),
  VITE_PROXY_BACKEND: z.string().default(""),
});

export const ENV = zEnv.parse(import.meta.env);
