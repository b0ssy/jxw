import p from "path";
import fs from "fs-extra";
import chalk from "chalk";
import moment from "moment";

import { ENV } from "../config";

export class Logger {
  name: string;
  logToFileOnly?: boolean;

  constructor(name: string, options?: { logToFileOnly?: boolean }) {
    this.name = name;
    this.logToFileOnly = options?.logToFileOnly;
  }

  debug(data: string, reason?: string | object | unknown) {
    this.log(`[DEBUG] (${this.name}) ${data}`, reason);
  }

  info(data: string, reason?: string | object | unknown) {
    this.log(`[INFO ] (${this.name}) ${data}`, reason);
  }

  warn(data: string, reason?: string | object | unknown) {
    this.log(`[WARN ] (${this.name}) ${data}`, reason);
  }

  error(data: string, reason?: string | object | unknown) {
    this.log(`[ERROR] (${this.name}) ${data}`, reason, { error: true });
  }

  log(
    data: string,
    reason?: string | object | unknown,
    options?: { error?: boolean }
  ) {
    const now = moment();
    data = `${now.format("YYYY-MM-DDTHH:mm:ss.SSSZ")} ${data}${
      reason ? `: ${JSON.stringify(reason)}` : ""
    }`;
    const directory = p.join(ENV.LOG_DIRECTORY, now.format("YYYY-MM"));
    fs.mkdirs(directory)
      .catch(() => null)
      .finally(() => {
        fs.appendFile(
          `${directory}/${now.format("YYYY-MM-DD")}.log`,
          `${data}\n`,
          (err) => {
            if (err) {
              console.error(`Failed to write log file: ${err}`);
            }
          }
        );
      });
    if (!this.logToFileOnly) {
      if (options?.error) {
        console.log(chalk.redBright(data));
      } else {
        console.log(data);
      }
    }
  }
}
