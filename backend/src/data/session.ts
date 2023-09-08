import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { z } from "zod";

import { ENV } from "../config";
import { Logger } from "../helpers/logger";
import {
  BadRequestError,
  InternalServerError,
  NotAuthorizedError,
} from "../errors";

const LOG = new Logger("data/session");

export const zJWTPayload = z.object({
  userId: z.string(),
});
export type JWTPayload = z.infer<typeof zJWTPayload>;

// User session
export class Session {
  jwtPayload: JWTPayload | null;
  accessToken: string | null;

  constructor(options: {
    jwtPayload: JWTPayload | null;
    accessToken: string | null;
  }) {
    this.jwtPayload = options.jwtPayload;
    this.accessToken = options.accessToken;
  }

  // Get user id
  // Throws error if does not exists
  getUserIdOrThrow() {
    if (!this.jwtPayload?.userId) {
      throw new NotAuthorizedError("Please provide a valid access token");
    }
    return this.jwtPayload.userId;
  }
}

// Get session
// This function assumes session is already decoded via decodeSession()
// Returns session on success, throws exception otherwise
export const getSessionOrThrow = (res: Response) => {
  // decodeSession() must be called first prior
  // So this shouldn't happen, but check nonetheless
  if (!("session" in res.locals)) {
    LOG.error("Session not decoded");
    throw new InternalServerError();
  }
  const session = res.locals["session"] as Session;
  return session;
};

// Decode session from request object
// The decoded session will be stored inside response object
// under the res.locals["session"] field
export const decodeSession = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Decode all authentication methods
    let accessToken: string | null = null;
    const bearerToken = req.headers["authorization"]?.split(" ");
    if (bearerToken && bearerToken[0] === "Bearer" && bearerToken[1]) {
      accessToken = bearerToken[1];
    }

    // Verify and decode token
    let jwtPayload: JWTPayload | null = null;
    if (accessToken) {
      jwtPayload = decodeJWTPayload(accessToken);
    }

    // Store in res.locals["session"]
    const session = new Session({ jwtPayload, accessToken });
    res.locals["session"] = session;

    next();
  } catch (err) {
    next(err);
  }
};

// Parse request object to get:
// 1) Session
// 2) Body (optional)
// 3) Params (optional)
// 4) Headers (optional)
export const decode = <
  TBody extends z.AnyZodObject,
  TQuery extends z.AnyZodObject,
  TParams extends z.AnyZodObject,
  THeaders extends z.AnyZodObject
>(
  req: Request,
  res: Response,
  schema?: z.ZodObject<{
    body?: TBody;
    query?: TQuery;
    params?: TParams;
    headers?: THeaders;
  }>
): {
  body: z.infer<TBody>;
  query: z.infer<TQuery>;
  params: z.infer<TParams>;
  headers: z.infer<THeaders>;
  session: Session;
} => {
  // decodeSession() should already be called before
  const session = res.locals["session"];
  if (!session) {
    throw new NotAuthorizedError();
  }

  let body: z.infer<TBody> = {};
  let query: z.infer<TQuery> = {};
  let params: z.infer<TParams> = {};
  let headers: z.infer<THeaders> = {};
  if (schema?.shape.body) {
    const parsed = schema.shape.body.safeParse(req.body);
    if (!parsed.success) {
      throw new BadRequestError(
        `Check your request body: ${parsed.error.errors
          .map((e) => `[${e.path}] ${e.message}`)
          .join(", ")}`,
        "invalid_request_body"
      );
    }
    body = parsed.data;
  }
  if (schema?.shape.query) {
    const parsed = schema.shape.query.safeParse(req.query);
    if (!parsed.success) {
      throw new BadRequestError(
        `Check your request query: ${parsed.error.errors
          .map((e) => `[${e.path}] ${e.message}`)
          .join(", ")}`,
        "invalid_request_query"
      );
    }
    query = parsed.data;
  }
  if (schema?.shape.params) {
    const parsed = schema.shape.params.safeParse(req.params);
    if (!parsed.success) {
      throw new BadRequestError(
        `Check your request params: ${parsed.error.errors
          .map((e) => `[${e.path}] ${e.message}`)
          .join(", ")}`,
        "invalid_request_params"
      );
    }
    params = parsed.data;
  }
  if (schema?.shape.headers) {
    const parsed = schema.shape.headers.safeParse(req.headers);
    if (!parsed.success) {
      throw new BadRequestError(
        `Check your request headers: ${parsed.error.errors
          .map((e) => `[${e.path}] ${e.message}`)
          .join(", ")}`,
        "invalid_request_headers"
      );
    }
    headers = parsed.data;
  }
  return {
    body,
    query,
    params,
    headers,
    session,
  };
};

// Decode JWT payload from access token
// Returns JWT payload on success
export const decodeJWTPayload = (accessToken: string): JWTPayload => {
  try {
    const decoded = jwt.verify(accessToken, ENV.JWT_SECRET) as jwt.JwtPayload;
    return zJWTPayload.parse(decoded);
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new NotAuthorizedError(
        "Please provide a valid access token",
        "expired_access_token"
      );
    } else {
      throw new NotAuthorizedError(
        "Please provide a valid access token",
        "invalid_access_token"
      );
    }
  }
};

// Authorize user
export const authorize =
  (options: { onCheckSession?: (session: Session) => void }) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // decodeSession() should already be called before
      if (!res.locals["session"]) {
        throw new NotAuthorizedError();
      }
      const session: Session = res.locals["session"];

      const { onCheckSession } = options;

      // Custom callback to check session
      if (onCheckSession) {
        onCheckSession(session);
      }

      next();
    } catch (err) {
      next(err);
    }
  };
