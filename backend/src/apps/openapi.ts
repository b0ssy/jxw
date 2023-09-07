import { OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import { promises as fs } from "fs";
import p from "path";

import { openApiRegistryV1, openApiRegistryV1Internal } from "../data";
import { Logger } from "../helpers/logger";

const LOG = new Logger("apps/openapi");

// Generate OpenAPI JSON document file
const execute = async (options: { dir: string }) => {
  LOG.info(`Generating OpenAPI documents`, options);

  const path = p.join(options.dir, "v1", "openapi.json");

  // Create directory
  await fs.mkdir(p.dirname(path), { recursive: true });

  // Write document
  LOG.info(`Writing file: ${path}`);
  const generator = new OpenApiGeneratorV3(openApiRegistryV1.definitions);
  const components = generator.generateDocument({
    openapi: "3.0.0",
    info: {
      title: "OpenAPI Definitions",
      version: "0.1.0",
    },
  });
  const json = JSON.stringify(components, undefined, "  ");
  await fs.writeFile(path, json).catch((err) => {
    console.error(`Failed to write file: ${err}`);
  });

  // Write internal document
  {
    const path = p.join(options.dir, "v1", "openapi-internal.json");
    LOG.info(`Writing file: ${path}`);

    const generator = new OpenApiGeneratorV3(
      openApiRegistryV1Internal.definitions
    );
    const components = generator.generateDocument({
      openapi: "3.0.0",
      info: {
        title: "OpenAPI Definitions",
        version: "0.1.0",
      },
    });
    const json = JSON.stringify(components, undefined, "  ");
    await fs.writeFile(path, json).catch((err) => {
      console.error(`Failed to write file: ${err}`);
    });
  }
};

export default execute;
