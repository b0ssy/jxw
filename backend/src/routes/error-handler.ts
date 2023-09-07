import { ErrorRequestHandler } from "express";
import { z } from "zod";

import { Logger } from "../helpers/logger";
import { sendError } from "../helpers/api";
import { AppError } from "../errors";

const LOG = new Logger("routes/error-handler");

// Handle errors gracefully globally and return proper error responses
//
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler: ErrorRequestHandler = (err, req, res, _) => {
  if (err instanceof z.ZodError) {
    sendError(res, 400, "bad_request");
  } else if (err instanceof AppError) {
    sendError(res, err.status, err.code, err.codeMessage);
  } else {
    // Remember not to send the error message back
    // because it is meant for internal consumption only!
    LOG.error("Unrecognized error", {
      message: err?.message ?? "",
      stack: err?.stack ?? "",
    });
    sendError(res, 500, "internal_server_error");
  }
};
