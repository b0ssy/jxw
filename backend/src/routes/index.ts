import { Express } from "express";

import webapp from "./webapp";
import { pageNotFound } from "./page-not-found";
import { errorHandler } from "./error-handler";
import { decodeSession } from "../data/session";

export const mountRoutes = async (app: Express) => {
  // Decode session
  // Please ensure this is called at the top
  app.use(decodeSession);

  // Serve webapp UI
  app.use(webapp);

  // Handle invalid pages
  app.use(pageNotFound);

  // Global error handler
  app.use(errorHandler);
};
