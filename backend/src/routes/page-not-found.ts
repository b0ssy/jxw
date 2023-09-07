import { RequestHandler } from "express";
import { sendError } from "../helpers/api";

// Handle 404 page not found responses
//
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const pageNotFound: RequestHandler = (req, res, _) => {
  sendError(res, 404, "page_not_found", "The page you requested is not found");
};
