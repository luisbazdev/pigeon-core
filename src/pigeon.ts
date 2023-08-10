const http = require("node:http");
const URL = require("node:url");

import { IncomingMessage, ServerResponse } from "node:http";
import { removeSlash, init, getParams, createAuthRoutes } from "./util";
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
export let Pigeon: IPigeon = {
  middlewares: [],
  handlers: [],
  repositories: [],
  server: http.createServer((req: IncomingMessage, res: ServerResponse) => {
    init(req, res);
    Pigeon.handle(req, res);
  }),
  settings: <ISettings>{
    auth: {
      type: "JWT",
      basic: {
        user: "guest",
        password: "guest",
      },
      jwt: {
        privateKey: "secret",
        routes: {
          enabled: true,
          login: "/login",
          signup: "/signup",
          logout: "/logout",
        },
      },
    },
    db: {
      mysql: {
        enabled: true,
        host: "localhost",
        user: "pigeon",
        password: "pigeon",
        database: "pigeon",
        port: 3306,
      },
      mongodb: {
        enabled: false,
        url: "",
        db: "",
        collection: "",
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
  handle: async function (req: any, res: any) {
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
      return res.status(404).send("Route Not Found...");

    const handler = Pigeon?.handlers?.find((handler) => {
      const regex = new RegExp(`^${handler.path.replace(/:\w+/g, "([^/]+)")}$`);
      const match = secondSegment.match(regex);
      return match ? true : false;
    });

    const foundRoute = handler?.routes?.find((route: any) => {
      const regex = new RegExp(`^${route.route.replace(/:\w+/g, "([^/]+)")}$`);
      const match =
        url.substring(secondSegment.length).match(regex) &&
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
    } else return res.status(404).send("Route Not Found...");

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
      GET: (path, func, middleware?: any[]) => handler.createEndpoint(path, func, "GET", middleware),
      POST: (path, func, middleware?: any[]) => handler.createEndpoint(path, func, "POST", middleware),
      PUT: (path, func, middleware?: any[]) => handler.createEndpoint(path, func, "PUT", middleware),
      DELETE: (path, func, middleware?: any[]) => handler.createEndpoint(path, func, "DELETE", middleware),
      createEndpoint: (path, func, method, middleware?: any[]) => {
        if (!isHandlerRoutePathValid(path) && path !== "/")
          throw new Error("Handler route path is invalid!");
        if (path === "/") path = "";
        const routeExists = handler.routes?.find(
          (route) => route.route === path && route.method === method
        );
        if (routeExists) throw new Error("Route already exists for this handler!");
        handler.routes.push({
          route: path,
          callback: func,
          method: method,
          middlewares: middleware ?? [],
        });
      },
    };
    this.addHandler(handler)
    return handler;
  },
  addRepository: function (name: string, _repository: IRepository) {
    _repository.name = name;
    this.repositories.push(_repository);
  },
  addMiddleware: function (_middleware: IMiddlewareFunction) {
    this.middlewares.push(_middleware);
  },
  auth: function (type: AuthType, settings?: JWTSettings | HTTPBasicSettings) {
    this.settings.auth.type = type;
    if (type !== "None") {
      this.settings.auth[type] = { ...settings };
    }
  },
  database: function (type: DBType, settings: MySQLSettings | MongoDBSettings) {
    this.settings.db[type] = { ...settings };
  },
  port: function (port: string | number) {
    this.settings.port = port;
  },
  start: async function () {
    await initializeDatabase();

    this.addMiddleware(bodyMiddleware);
    this.addMiddleware(cookiesMiddleware);
    if (this.settings.auth.type !== "None")
      this.addMiddleware(authenticate());

    if (
      this.settings.auth.type === "JWT" &&
      this.settings.auth.jwt.routes.enabled
    )
      this.addHandler(createAuthRoutes());

    this.listen(this.settings.port, () => {
      console.log(`Your API is running on port ${this.settings.port}`);
    });
  },
};
