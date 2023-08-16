const http = require("node:http");
const URL = require("node:url");

import { removeSlash, getParams, createAuthRoutes } from "./util";
import {
  AuthType,
  DBType,
  HTTPBasicSettings,
  IHandler,
  IHandlerFuction,
  IMiddlewareFunction,
  IPigeon,
  IRepository,
  ISettings,
  JWTSettings,
  MongoDBSettings,
  MySQLSettings,
} from "./interfaces";
import { initializeDatabase } from "./database";
import { bodyMiddleware, cookiesMiddleware } from "./middleware/built";
import { authenticate } from "./auth";
import { isHandlerPathValid, isHandlerRoutePathValid } from "./util";
import * as path from "node:path";
import * as fs from "node:fs/promises";

import { IncomingMessage, ServerResponse } from "node:http";

export let Pigeon: IPigeon = {
  middlewares: [],
  handlers: [],
  repositories: [],
  server: http.createServer((req: IncomingMessage, res: ServerResponse) => {
    Pigeon.handle(req, res);
  }),
  settings: <ISettings>{
    auth: {
      type: "basic",
      basic: {
        user: "guest",
        password: "guest",
      },
      jwt: {
        global: "false",
        privateKey: "secret",
        routes: {
          enabled: "false",
          login: "/login",
          signup: "/signup",
          logout: "/logout",
        },
      },
    },
    db: {
      mysql: {
        enabled: "false",
        host: "host",
        user: "user",
        password: "password",
        database: "database",
        port: "3306",
      },
      mongodb: {
        enabled: "false",
        url: "url",
        db: "db",
        collection: "collection",
      },
    },
    port: "2020",
  },
  listen: function (port: string, callback: any) {
    this.server.listen(port, callback);
  },
  run: async function (
    appMiddlewares: Array<any>,
    req: IncomingMessage,
    res: ServerResponse
  ) {
    let middlewareIndex = 0;
    const next = async () => {
      middlewareIndex++;
      if (middlewareIndex < appMiddlewares.length - 1) {
        await appMiddlewares[middlewareIndex](req, res, next);
      } else {
        // the actual callback function
        await appMiddlewares[middlewareIndex](req, res);
      }
    };
    if (appMiddlewares.length > 0) {
      await appMiddlewares[0](req, res, next);
    }
  },
  handle: async function (req: IncomingMessage, res: ServerResponse) {
    // Middleware cycle:
    // General middleware -> Handler middleware -> Route middleware -> Callback function
    let appMiddlewares = [...Pigeon.middlewares];

    let { url, method } = req;
    url = removeSlash(url);
    const urlObject = URL.parse(url, true);
    const { pathname, query } = urlObject;
    const pathSegments = pathname.split("/");
    const firstSegment = pathSegments[1];
    const secondSegment = "/api/" + pathSegments[2];
    if (firstSegment !== "api")
      return res
        .status(404)
        .json({ error: "The requested resource could not be found." });

    const handler = Pigeon?.handlers?.find((handler) => {
      const regex = new RegExp(`^${handler.path.replace(/:\w+/g, "([^/]+)")}$`);
      const match = secondSegment.match(regex);
      return match ? true : false;
    });

    const foundRoute = handler?.routes?.find((route: any) => {
      const regex = new RegExp(`^${route.route.replace(/:\w+/g, "([^/]+)")}$`);
      const match =
        url?.substring(secondSegment.length).match(regex) &&
        route.method === method;
      if (match) {
        req.query = query;
        req.params = getParams(
          secondSegment + route.route,
          pathname.substring(secondSegment.length).match(regex)
        );
      }
      return match;
    });

    if (handler && foundRoute) {
      appMiddlewares.push(
        ...handler.middlewares,
        ...foundRoute.middlewares,
        foundRoute.callback
      );
    } else
      return res
        .status(404)
        .json({ error: "The requested resource could not be found." });

    await Pigeon.run(appMiddlewares, req, res);
  },
  addHandler: function (_handler: IHandler) {
    const handlerExists = this.handlers?.find(
      (handler) => handler.path === "/api" + _handler.path
    );
    if (handlerExists) {
      throw new Error("Handler already exists!");
    }
    this.handlers.push(_handler);
  },
  createHandler: function (path: string, middleware?: any[]) {
    // if middlewares not an array: throw new Error("You must provide an array of middlewares!")
    if (!isHandlerPathValid(path)) throw new Error("Handler path is invalid!");
    const handler: IHandler = {
      path: "/api" + path,
      routes: [],
      middlewares: middleware ?? [],
      GET: (path, callback, middleware?: any[]) =>
        handler.createEndpoint(path, callback, "GET", middleware),
      POST: (path, callback, middleware?: any[]) =>
        handler.createEndpoint(path, callback, "POST", middleware),
      PUT: (path, callback, middleware?: any[]) =>
        handler.createEndpoint(path, callback, "PUT", middleware),
      DELETE: (path, callback, middleware?: any[]) =>
        handler.createEndpoint(path, callback, "DELETE", middleware),
      createEndpoint: (path, callback, method, middleware?: IMiddlewareFunction[]) => {
        if (!isHandlerRoutePathValid(path) && path !== "/")
          throw new Error("Handler route path is invalid!");
        if (path === "/") path = "";
        const routeExists = handler.routes?.find(
          (route) => route.route === path && route.method === method
        );
        if (routeExists)
          throw new Error("Route already exists for this handler!");
        handler.routes.push({
          route: path,
          callback,
          method: method,
          middlewares: middleware ?? [],
        });
      },
    };
    this.addHandler(handler);
    return handler;
  },
  addRepository: function (name: string, _repository: IRepository) {
    _repository.name = name;
    this.repositories.push(_repository);
  },
  addMiddleware: function (_middleware: IMiddlewareFunction) {
    if (_middleware) this.middlewares.push(_middleware);
  },
  auth: function (type: AuthType, settings?: JWTSettings | HTTPBasicSettings) {
    this.settings.auth.type = type;
    if (type !== "none") {
      this.settings.auth[type] = { ...settings };
    }
  },
  port: function (port: string | number) {
    this.settings.port = port;
  },
  initialize: async function () {
    await initializeDatabase();

    this.addMiddleware(bodyMiddleware);
    this.addMiddleware(cookiesMiddleware);
    if (this.settings.auth.type !== "none") this.addMiddleware(authenticate());

    if (
      this.settings.auth.type === "jwt" &&
      this.settings.auth.jwt.routes.enabled === "true"
    )
      this.addHandler(createAuthRoutes());
  },
  start: async function () {
    await this.initialize();
    const handlersDir = path.join(process.cwd(), "build", "src", "handler");
    try {
      const files = await fs.readdir(handlersDir);
      for (const file of files) {
        const filePath = path.join(handlersDir, file);
        require(filePath);
      }
    } catch (err) {
      console.error(err);
    }
    this.listen(this.settings.port, () => {
      console.log(`Your API is running on port ${this.settings.port}`);
    });
  },
};
