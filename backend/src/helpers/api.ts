import { Response } from "express";
import { z } from "zod";

import { InternalServerError } from "../errors";

export const zApiResponse = z.object({
  code: z.string(),
  message: z.string().nullable(),
  data: z.any().nullable(),
});
export type ApiResponse = z.infer<typeof zApiResponse>;

// Make api response
export const makeApiResponse = <T extends z.ZodTypeAny>(schema?: T) => {
  return z.object({
    code: z.string(),
    message: z.string().nullable(),
    data: schema ?? z.object({}),
  });
};

// Send 2xx successful response
export const sendSuccess = <T>(
  res: Response,
  data: T | null,
  options?: {
    code?: string;
    message?: string;
    status?: number;
  }
) => {
  // Ensure 2xx status code
  if (options?.status && (options.status < 200 || options.status > 299)) {
    throw new InternalServerError("Error response status code must be 2xx");
  }
  const apiRes: ApiResponse = {
    code: options?.code ?? "success",
    message: options?.message ?? "Successful operation",
    data: data || {},
  };
  res.status(options?.status ?? 200).send(apiRes);
};

// Send error responses
export const sendError = (
  res: Response,
  status: number,
  code: string,
  message?: string
) => {
  // Ensure not 2xx status code
  if (status >= 200 && status <= 299) {
    throw new InternalServerError("Error response status code must not be 2xx");
  }
  const apiRes: ApiResponse = {
    code,
    message: message ?? "Error has occurred",
    data: null,
  };
  res.status(status).send(apiRes);
};
