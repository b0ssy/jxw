import p from "path";
import fs from "fs-extra";
import crypto from "crypto";
import chalk from "chalk";

import { zEnv } from "../config";

// Initialize application defaults
const execute = async (options: { create?: boolean; test?: boolean }) => {
  await createDefaultEnvVariables(options);
  console.log();
  console.log(chalk.greenBright("✓ Initialized successfully"));
};

// Create default env variables
const createDefaultEnvVariables = async (options: {
  create?: boolean;
  test?: boolean;
}) => {
  console.log("✓ Generating env variables");
  const lines: string[] = [];
  let section = "";
  const env = zEnv.omit({ isNodeEnv: true }).parse({});
  for (const key in env) {
    const currSection = key.split("_")[0];
    if (section && section !== currSection) {
      lines.push("");
    }
    section = currSection;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let value = (env as any)[key];
    if (key === "JWT_SECRET") {
      value = crypto.randomBytes(32).toString("base64url");
    }
    if (options.test) {
      if (key === "NODE_ENV") {
        value = "test";
      } else if (key === "LOG_DIRECTORY") {
        value = p.join(p.dirname(value), "test", "logs");
      } else if (key === "SERVER_PORT") {
        value = "8181";
      }
    }
    lines.push(`${key}=${value}`);
  }

  // Create env file by default
  // But if already exists, then print out to console
  const envPath = `.env${options.test ? ".test" : ""}`;
  const canWrite = !(await fs.exists(envPath));
  if (canWrite) {
    lines.push("");
    await fs.writeFile(envPath, lines.join("\n"));
  }
  // Otherwise, print out
  else {
    console.log(
      `Environment file "${envPath}" already exists, printing to console instead.`
    );
    console.log("...");
    console.log(lines.join("\n"));
    console.log("...");
  }
};

export default execute;
