import { Express } from "express";

import v1login from "./v1/login";
import v1chats from "./v1/chats";
import webapp from "./webapp";
import { pageNotFound } from "./page-not-found";
import { errorHandler } from "./error-handler";
import { decodeSession } from "../data/session";

export const mountRoutes = async (app: Express) => {
  // Decode session
  // Please ensure this is called at the top
  app.use(decodeSession);

  // Auth routes
  app.use(v1login);
  
  // Chat routes
  app.use(v1chats);

  // Serve webapp
  app.use(webapp);

  // Handle invalid pages
  app.use(pageNotFound);

  // Global error handler
  app.use(errorHandler);
};
