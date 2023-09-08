import express from "express";
import Router from "express-promise-router";

import { ENV } from "../config";

const router = Router();

// Serve webapp
// TODO: Kinda ugly here. Need to rework webapp base url.
router.use("/", express.static(ENV.WEBAPP_BUILD_DIR));
router.use("/login", express.static(ENV.WEBAPP_BUILD_DIR));

export default router;
