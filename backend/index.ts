import dotenv from "dotenv";
dotenv.config(); // Remember to call this at the top to load .env file!

import { Command } from "commander";

import init from "./src/apps/init";
import run from "./src/apps/run";
import openapi from "./src/apps/openapi";
import { Logger } from "./src/helpers/logger";

const LOG = new Logger("index");

const program = new Command();

// Top level CLI info
program.name("backend");
program.description("JWX backend service");
program.version("0.1.0");

// CLI commands
program
  .command("init")
  .description("Initialize server configurations")
  .option(
    "-c, --create",
    "Flag to create .env (or .env.test, if --test is specified) environment file. Will throw error if file already exists."
  )
  .option(
    "-t, --test",
    "Flag to indicate generation of unit test environment file"
  )
  .action((options) => {
    init({
      create: !!options.create,
      test: !!options.test,
    });
  });
program
  .command("run")
  .description("Run server")
  .action(() => {
    run();
  });

program
  .command("openapi")
  .description("Generate OpenAPI documents and clients")
  .requiredOption(
    "-d, --dir <directory>",
    "Directory to generate OpenAPI documents and clients",
    "./openapi"
  )
  .action((options) => {
    openapi({ dir: options.dir });
  });

program.parse();

// Close app on SIGINT signal
process.on("SIGINT", () => {
  console.log("SIGINT");
  process.exit(0);
});

// Log down system-wide exceptions and do not crash the app
process.on("uncaughtException", (err) => {
  LOG.error("Uncaught exception", {
    message: err?.message ?? "",
    stack: err?.stack ?? "",
  });
});
process.on("unhandledRejection", (err) => {
  console.error(err);
  LOG.error("Unhandled rejection", { err });
});
