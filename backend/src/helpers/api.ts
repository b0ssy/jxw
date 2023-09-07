import { Response } from "express";
import {
  z,
  AnyZodObject,
  ZodObject,
  ZodNumber,
  ZodArray,
  ZodTypeAny,
} from "zod";

import { BadRequestError, NotFoundError, InternalServerError } from "../errors";

export const MAX_LIMIT = 1000;

export const zWhereQuery = z.object({
  eq: z.union([z.string(), z.number(), z.date()]).optional(),
  notEq: z.union([z.string(), z.number(), z.date()]).optional(),
  like: z.string().optional(),
  lt: z.union([z.string(), z.number(), z.date()]).optional(),
  lte: z.union([z.string(), z.number(), z.date()]).optional(),
  gt: z.union([z.string(), z.number(), z.date()]).optional(),
  gte: z.union([z.string(), z.number(), z.date()]).optional(),
  between: z.union([z.string(), z.number(), z.date()]).array().optional(),
  isNull: z.boolean().optional(),
  isNotNull: z.boolean().optional(),
});
export type WhereQuery = z.infer<typeof zWhereQuery>;

export const zCount = z
  .object({ count: z.coerce.number() })
  .array()
  .length(1)
  .transform((v) => v[0].count);

export const zGetManyOptions = z.object({
  ids: z.string().array().optional(),
  start: z.date().optional(),
  end: z.date().optional(),
  offset: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
  sortColumn: z.string().optional(),
  sortBy: z.enum(["asc", "desc"]).optional(),
  countOnly: z.coerce.boolean().optional(),
});
export type GetManyOptions = z.infer<typeof zGetManyOptions>;

export const zApiResponse = z.object({
  code: z.string(),
  message: z.string().nullable(),
  data: z.any().nullable(),
});
export type ApiResponse = z.infer<typeof zApiResponse>;

export class InvalidIdError extends NotFoundError {
  constructor() {
    super("Please provide a valid id", "invalid_id");
  }
}

export class EmptyUpdateError extends BadRequestError {
  constructor() {
    super("Empty update", "empty_update");
  }
}

export const makeApi = <
  TCreateOneBodyRequest extends AnyZodObject,
  TCreateOneQueryRequest extends AnyZodObject,
  TCreateOneParamsRequest extends AnyZodObject,
  TCreateOneHeadersRequest extends AnyZodObject,
  TCreateOneResponse extends AnyZodObject,
  TGetOneQueryRequest extends AnyZodObject,
  TGetOneParamsRequest extends AnyZodObject,
  TGetOneHeadersRequest extends AnyZodObject,
  TGetOneResponse extends AnyZodObject,
  TGetManyQueryRequest extends AnyZodObject,
  TGetManyParamsRequest extends AnyZodObject,
  TGetManyHeadersRequest extends AnyZodObject,
  TGetManyResponse extends AnyZodObject,
  TUpdateOneBodyRequest extends AnyZodObject,
  TUpdateOneQueryRequest extends AnyZodObject,
  TUpdateOneParamsRequest extends AnyZodObject,
  TUpdateOneHeadersRequest extends AnyZodObject,
  TUpdateOneResponse extends AnyZodObject,
  TDeleteOneBodyRequest extends AnyZodObject,
  TDeleteOneQueryRequest extends AnyZodObject,
  TDeleteOneParamsRequest extends AnyZodObject,
  TDeleteOneHeadersRequest extends AnyZodObject,
  TDeleteOneResponse extends AnyZodObject,
  TDeleteManyBodyRequest extends AnyZodObject,
  TDeleteManyQueryRequest extends AnyZodObject,
  TDeleteManyParamsRequest extends AnyZodObject,
  TDeleteManyHeadersRequest extends AnyZodObject,
  TDeleteManyResponse extends AnyZodObject
>(options: {
  createOneRequest?: ZodObject<{
    body?: TCreateOneBodyRequest;
    query?: TCreateOneQueryRequest;
    params?: TCreateOneParamsRequest;
    headers?: TCreateOneHeadersRequest;
  }>;
  createOneResponse?: TCreateOneResponse;

  getOneRequest?: ZodObject<{
    query?: TGetOneQueryRequest;
    params?: TGetOneParamsRequest;
    headers?: TGetOneHeadersRequest;
  }>;
  getOneResponse?: ZodObject<{
    data: TGetOneResponse;
  }>;

  getManyRequest?: ZodObject<{
    query?: TGetManyQueryRequest;
    params?: TGetManyParamsRequest;
    headers?: TGetManyHeadersRequest;
  }>;
  getManyResponse?: ZodObject<{
    data: ZodArray<TGetManyResponse>;
    count: ZodNumber;
  }>;

  updateOneRequest?: ZodObject<{
    body?: TUpdateOneBodyRequest;
    query?: TUpdateOneQueryRequest;
    params?: TUpdateOneParamsRequest;
    headers?: TUpdateOneHeadersRequest;
  }>;
  updateOneResponse?: TUpdateOneResponse;

  deleteOneRequest?: ZodObject<{
    body?: TDeleteOneBodyRequest;
    query?: TDeleteOneQueryRequest;
    params?: TDeleteOneParamsRequest;
    headers?: TDeleteOneHeadersRequest;
  }>;
  deleteOneResponse?: TDeleteOneResponse;

  deleteManyRequest?: ZodObject<{
    body?: TDeleteManyBodyRequest;
    query?: TDeleteManyQueryRequest;
    params?: TDeleteManyParamsRequest;
    headers?: TDeleteManyHeadersRequest;
  }>;
  deleteManyResponse?: TDeleteManyResponse;
}) => {
  const zCreateOneRequest = options.createOneRequest;
  const zCreateOneResponse = options.createOneResponse;

  const zGetOneRequest = options.getOneRequest;
  const zGetOneResponse = options.getOneResponse;

  const zGetManyRequest = options.getManyRequest;
  const zGetManyResponse = options.getManyResponse;

  const zUpdateOneRequest = options.updateOneRequest;
  const zUpdateOneResponse = options.updateOneResponse;

  const zDeleteOneRequest = options.deleteOneRequest;
  const zDeleteOneResponse = options.deleteOneResponse;

  const zDeleteManyRequest = options.deleteManyRequest;
  const zDeleteManyResponse = options.deleteManyResponse;

  return {
    zCreateOneRequest,
    zCreateOneResponse,
    createOneSuccess: zCreateOneResponse
      ? sendSuccess<z.infer<typeof zCreateOneResponse>>
      : () => null,

    zGetOneRequest,
    zGetOneResponse,
    getOneSuccess: zGetOneResponse
      ? sendSuccess<z.infer<typeof zGetOneResponse>>
      : () => null,

    zGetManyRequest,
    zGetManyResponse,
    getManySuccess: zGetManyResponse
      ? sendSuccess<z.infer<typeof zGetManyResponse>>
      : () => null,

    zUpdateOneRequest,
    zUpdateOneResponse,
    updateOneSuccess: zUpdateOneResponse
      ? sendSuccess<z.infer<typeof zUpdateOneResponse>>
      : () => null,

    zDeleteOneRequest,
    zDeleteOneResponse,
    deleteOneSuccess: zDeleteOneResponse
      ? sendSuccess<z.infer<typeof zDeleteOneResponse>>
      : () => null,

    zDeleteManyRequest,
    zDeleteManyResponse,
    deleteManySuccess: zDeleteManyResponse
      ? sendSuccess<z.infer<typeof zDeleteManyResponse>>
      : () => null,
  };
};

// Make api response
export const makeApiResponse = <T extends ZodTypeAny>(schema?: T) => {
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
