import express from "express";
import Router from "express-promise-router";

import { ENV } from "../config";

const router = Router();

// Serve webapp
router.use("/", express.static(ENV.WEBAPP_BUILD_DIR));

export default router;
