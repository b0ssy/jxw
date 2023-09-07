import dotenv from "dotenv";
dotenv.config(); // Remember to call this at the top to load .env file!

import { Command } from "commander";

import init from "./src/apps/init";
import run from "./src/apps/run";
import { Logger } from "./src/helpers/logger";

const LOG = new Logger("index");

const program = new Command();

program.name("backend").description("JWX backend service").version("0.1.0");

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
