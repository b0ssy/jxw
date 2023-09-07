import { RouteConfig, OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { Router, Request, Response } from "express";
import PromiseRouter from "express-promise-router";
import { z, ZodObject, AnyZodObject, ZodSchema } from "zod";

import db, { EventLog } from "./db";
import { Session, decode } from "./session";
import { makeApiResponse, sendSuccess } from "../helpers/api";

export type Tag = "Admin";

export const openApiRegistryV1 = new OpenAPIRegistry();
export const openApiRegistryV1Internal = new OpenAPIRegistry();

export const registerSchemaOpenAPIv1 = <T extends ZodSchema>(
  refId: string,
  zodSchema: T,
  options?: {
    public?: boolean;
  }
) => {
  if (options?.public) {
    openApiRegistryV1.register(refId, zodSchema);
  }
  openApiRegistryV1Internal.register(refId, zodSchema);
};

export type ControllerOptions = {
  ctl?: Controller;
  session?: Session;
};

export class Controller {
  session: Session;
  db = {};

  constructor(options?: ControllerOptions) {
    this.session =
      options?.ctl?.session ??
      options?.session ??
      new Session({ jwtPayload: null, accessToken: null });
  }
}

export class Routes<TController extends Controller> {
  router: Router;
  createController: () => TController;

  constructor(options: {
    router?: Router;
    createController: () => TController;
  }) {
    this.router = options.router ?? PromiseRouter();
    this.createController = options.createController;
  }

  get<
    TReqBody extends AnyZodObject,
    TReqQuery extends AnyZodObject,
    TReqParams extends AnyZodObject,
    TReqHeaders extends AnyZodObject,
    TResSuccessBody extends AnyZodObject
  >(
    path: string,
    summary: string,
    options: {
      req?: ZodObject<{
        body?: TReqBody;
        query?: TReqQuery;
        params?: TReqParams;
        headers?: TReqHeaders;
      }>;
      resSuccessBody?: TResSuccessBody;
      resSuccessDescription?: string; // Default: "Operation sucessful"
      public?: boolean;
      tags?: Tag[];
      description?: string;
      handler: (data: {
        ctl: TController;
        body: z.infer<TReqBody>;
        query: z.infer<TReqQuery>;
        params: z.infer<TReqParams>;
        headers: z.infer<TReqHeaders>;
        session: Session;
        req: Request;
        res: Response;
      }) => Promise<z.infer<TResSuccessBody> | void>;
    }
  ): this {
    return this.use("get", path, summary, options);
  }

  post<
    TReqBody extends AnyZodObject,
    TReqQuery extends AnyZodObject,
    TReqParams extends AnyZodObject,
    TReqHeaders extends AnyZodObject,
    TResSuccessBody extends AnyZodObject
  >(
    path: string,
    summary: string,
    options: {
      req?: ZodObject<{
        body?: TReqBody;
        query?: TReqQuery;
        params?: TReqParams;
        headers?: TReqHeaders;
      }>;
      resSuccessBody?: TResSuccessBody;
      resSuccessDescription?: string; // Default: "Operation sucessful"
      public?: boolean;
      tags?: Tag[];
      description?: string;
      handler: (data: {
        ctl: TController;
        body: z.infer<TReqBody>;
        query: z.infer<TReqQuery>;
        params: z.infer<TReqParams>;
        headers: z.infer<TReqHeaders>;
        session: Session;
        req: Request;
        res: Response;
      }) => Promise<z.infer<TResSuccessBody> | void>;
    }
  ): this {
    return this.use("post", path, summary, options);
  }

  patch<
    TReqBody extends AnyZodObject,
    TReqQuery extends AnyZodObject,
    TReqParams extends AnyZodObject,
    TReqHeaders extends AnyZodObject,
    TResSuccessBody extends AnyZodObject
  >(
    path: string,
    summary: string,
    options: {
      req?: ZodObject<{
        body?: TReqBody;
        query?: TReqQuery;
        params?: TReqParams;
        headers?: TReqHeaders;
      }>;
      resSuccessBody?: TResSuccessBody;
      resSuccessDescription?: string; // Default: "Operation sucessful"
      public?: boolean;
      tags?: Tag[];
      description?: string;
      handler: (data: {
        ctl: TController;
        body: z.infer<TReqBody>;
        query: z.infer<TReqQuery>;
        params: z.infer<TReqParams>;
        headers: z.infer<TReqHeaders>;
        session: Session;
        req: Request;
        res: Response;
      }) => Promise<z.infer<TResSuccessBody> | void>;
    }
  ): this {
    return this.use("patch", path, summary, options);
  }

  delete<
    TReqBody extends AnyZodObject,
    TReqQuery extends AnyZodObject,
    TReqParams extends AnyZodObject,
    TReqHeaders extends AnyZodObject,
    TResSuccessBody extends AnyZodObject
  >(
    path: string,
    summary: string,
    options: {
      req?: ZodObject<{
        body?: TReqBody;
        query?: TReqQuery;
        params?: TReqParams;
        headers?: TReqHeaders;
      }>;
      resSuccessBody?: TResSuccessBody;
      resSuccessDescription?: string; // Default: "Operation sucessful"
      public?: boolean;
      tags?: Tag[];
      description?: string;
      handler: (data: {
        ctl: TController;
        body: z.infer<TReqBody>;
        query: z.infer<TReqQuery>;
        params: z.infer<TReqParams>;
        headers: z.infer<TReqHeaders>;
        session: Session;
        req: Request;
        res: Response;
      }) => Promise<z.infer<TResSuccessBody> | void>;
    }
  ): this {
    return this.use("delete", path, summary, options);
  }

  use<
    TReqBody extends AnyZodObject,
    TReqQuery extends AnyZodObject,
    TReqParams extends AnyZodObject,
    TReqHeaders extends AnyZodObject,
    TResSuccessBody extends AnyZodObject
  >(
    method: "get" | "post" | "put" | "delete" | "patch",
    path: string,
    summary: string,
    options: {
      req?: ZodObject<{
        body?: TReqBody;
        query?: TReqQuery;
        params?: TReqParams;
        headers?: TReqHeaders;
      }>;
      resSuccessBody?: TResSuccessBody;
      resSuccessDescription?: string; // Default: "Operation sucessful"
      public?: boolean;
      tags?: Tag[];
      description?: string;
      handler: (data: {
        ctl: TController;
        body: z.infer<TReqBody>;
        query: z.infer<TReqQuery>;
        params: z.infer<TReqParams>;
        headers: z.infer<TReqHeaders>;
        session: Session;
        req: Request;
        res: Response;
      }) => Promise<z.infer<TResSuccessBody> | void>;
    }
  ): this {
    let reqBodyRef: string | null = null;
    if (options.req?.shape.body) {
      reqBodyRef = `${path
        .replace(/{/g, "_")
        .replace(/}/g, "_")
        .split("/")
        .map((e) => (e.length > 0 ? e.charAt(0).toUpperCase() + e.slice(1) : e))
        .join("")}${method.charAt(0).toUpperCase()}${method.slice(
        1
      )}RequestBody`;
      registerSchemaOpenAPIv1(reqBodyRef, options.req.shape.body);
    }
    let resSuccessBodyRef: string | null = null;
    if (options.resSuccessBody) {
      resSuccessBodyRef = `${path
        .replace(/{/g, "_")
        .replace(/}/g, "_")
        .split("/")
        .map((e) => (e.length > 0 ? e.charAt(0).toUpperCase() + e.slice(1) : e))
        .join("")}${method.charAt(0).toUpperCase()}${method.slice(
        1
      )}200Response`;
      registerSchemaOpenAPIv1(
        resSuccessBodyRef,
        makeApiResponse(options.resSuccessBody)
      );
    }
    const routeConfig: RouteConfig = {
      method,
      path,
      summary,
      description: options?.description ?? summary,
      request: {
        body: reqBodyRef
          ? {
              content: {
                "application/json": {
                  schema: { $ref: `#/components/schemas/${reqBodyRef}` },
                },
              },
              required: true,
            }
          : undefined,
        query: options.req?.shape.query ?? undefined,
        params: options.req?.shape.params ?? undefined,
        headers: options.req?.shape.headers ?? undefined,
      },
      responses: resSuccessBodyRef
        ? {
            200: {
              description:
                options?.resSuccessDescription ?? "Operation sucessful",
              content: {
                "application/json": {
                  schema: { $ref: `#/components/schemas/${resSuccessBodyRef}` },
                },
              },
            },
          }
        : {},
      tags: options?.tags,
    };
    if (options?.public) {
      openApiRegistryV1.registerPath(routeConfig);
    }
    openApiRegistryV1Internal.registerPath(routeConfig);

    const routerPath = path.replace(/{/g, ":").replace(/}/g, "");
    const routerHandler = async (req: Request, res: Response) => {
      const decoded = decode(req, res, options.req);
      const ctl = this.createController();
      ctl.session = decoded.session;
      const result = await options.handler({ ctl, ...decoded, req, res });
      sendSuccess(res, result ? options.resSuccessBody?.parse(result) : {});
    };
    switch (method) {
      case "get":
        this.router.get(routerPath, routerHandler);
        break;
      case "post":
        this.router.post(routerPath, routerHandler);
        break;
      case "put":
        this.router.put(routerPath, routerHandler);
        break;
      case "delete":
        this.router.delete(routerPath, routerHandler);
        break;
      case "patch":
        this.router.patch(routerPath, routerHandler);
        break;
      default:
        console.error(`Invalid router path: ${path}`);
        break;
    }
    return this;
  }
}
