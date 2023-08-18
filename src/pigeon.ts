const http = require("node:http");
const URL = require("node:url");

import {
  AuthType,
  HTTPBasicSettings,
  IHandler,
  IHandlerFuction,
  IMiddlewareFunction,
  IPigeon,
  IRepository,
  ISettings,
  JWTSettings,
} from "./interfaces";
import { bodyMiddleware, cookiesMiddleware } from "./middleware/built";
import { authenticate } from "./auth";
import { isHandlerPathValid, isHandlerRoutePathValid, removeSlash, getParams, createAuthRoutes } from "./util";
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
  // Default settings for the API
  settings: <ISettings>{
    auth: {
      type: "none",
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
    port: "2020",
  },
  /**
   * Starts the server and listens on the specified port.
   * @param {string} port - The port number on which the server should listen.
   * @param {Function} callback - The callback function to be executed when the server starts listening.
   */
  listen: function (port: string, callback: any) {
    this.server.listen(port, callback);
  },
  /**
   * Runs the middleware cycle.
   * @param {Array<any>} appMiddlewares - The array of middlewares to be executed.
   * @param {IncomingMessage} request - The incoming request object.
   * @param {ServerResponse} response - The server response object.
   */
  run: async function (
    appMiddlewares: Array<any>,
    request: IncomingMessage,
    response: ServerResponse
  ) {
    // The current middleware to execute
    let middlewareIndex = 0;
    const next = async () => {
      // Move the pointer to the next middleware in every execution
      middlewareIndex++;
      // If there is still middleware to execute
      if (middlewareIndex < appMiddlewares.length - 1) {
        await appMiddlewares[middlewareIndex](request, response, next);
      } else {
        // If the index of the current middleware equals to appMiddlewares.length - 1
        // then that means this is the current callback function of the route, which is
        // why we do not pass next as an argument!
        await appMiddlewares[middlewareIndex](request, response);
      }
    };
    if (appMiddlewares.length > 0) {
      await appMiddlewares[0](request, response, next);
    }
  },
  /**
   * Handles the incoming request.
   * @param {IncomingMessage} req - The incoming request object.
   * @param {ServerResponse} res - The server response object.
   */
  handle: async function (req: IncomingMessage, res: ServerResponse) {
    // Middleware cycle goes like:
    // General middleware -> Handler middleware -> Route middleware -> Callback function
    // That's why we initialize appMiddlewares as [...Pigeon.middlewares]
    let appMiddlewares = [...Pigeon.middlewares];

    let { url, method } = req;
    url = removeSlash(url);
    const urlObject = URL.parse(url, true);
    // Get the path and query parameters of the URL
    const { pathname, query } = urlObject;

    const pathSegments = pathname.split("/");
    // This is the route of the handler we will look for
    // i.e. "/api/tests"
    const secondSegment = "/api/" + pathSegments[2];

    // Find a handler that matches "/api/tests"
    const handler = Pigeon?.handlers?.find((handler) => {
      const regex = new RegExp(`^${handler.path.replace(/:\w+/g, "([^/]+)")}$`);
      const match = secondSegment.match(regex);
      return match ? true : false;
    });
    // Find a route inside "/api/tests" that matches the rest of the URL
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
      // Build appMiddlewares in the correct order of the middleware cycle:
      // General middleware -> Handler middleware -> Route middleware -> Callback function
      appMiddlewares.push(
        ...handler.middlewares,
        ...foundRoute.middlewares,
        foundRoute.callback
      );
    }
    // If both a handler and a route inside the handler match the whole path,
    // then the path is not registered!
    else {
      return res
        .status(404)
        .json({ error: "The requested resource could not be found." });
    }
    // Run all middleware in the middleware cycle!
    await Pigeon.run(appMiddlewares, req, res);
  },
  /**
   * Adds a new handler to the handlers array.
   * @param {IHandler} handler - The incoming request object.
   */
  addHandler: function (handler: IHandler) {
    const handlerExists = this.handlers?.find(
      (_handler) => _handler.path === "/api" + handler.path
    );
    if (handlerExists) {
      throw new Error("Handler already exists!");
    }
    this.handlers.push(handler);
  },
  /**
   * Creates a handler object with specified path and optional middleware.
   * @param {string} path - The path for the handler.
   * @param {any[]} [middleware] - Optional array of middlewares.
   * @returns {IHandler} - The created handler object.
   * @throws {Error} - If either handler path route is invalid.
   */
  createHandler: function (path: string, middleware?: any[]) {
    if (!isHandlerPathValid(path)) throw new Error("Handler path is invalid!");
    // Creates a new handler with path and middleware variables
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
      createEndpoint: (
        path,
        callback,
        method,
        middleware?: IMiddlewareFunction[]
      ) => {
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
  /**
   * Adds a new general middleware function to middlewares array.
   * @param {IMiddlewareFunction} middleware - The general middleware function to add.
   */
  addMiddleware: function (middleware: IMiddlewareFunction) {
    if (middleware) this.middlewares.push(middleware);
  },
  /**
   * Sets the authentication type and settings for the API.
   * @param {AuthType} type - The authentication type.
   * @param {JWTSettings | HTTPBasicSettings} [settings] - The authentication settings.
   */
  auth: function (type: AuthType, settings?: JWTSettings | HTTPBasicSettings) {
    this.settings.auth.type = type;
    if (type !== "none") {
      this.settings.auth[type] = { ...settings };
    }
  },
  /**
   * Sets the port on which the HTTP server will listen.
   * @param {string | number} port - The port number or string representation of the port.
   */
  port: function (port: string | number) {
    this.settings.port = port;
  },
  /**
   * Starts the Pigeon API.
   */
  start: async function () {
    // Adds body and cookies objects to request object
    this.addMiddleware(bodyMiddleware);
    this.addMiddleware(cookiesMiddleware);
    // If any type of authentication is set in the settings add it to the general middleware array.
    if (this.settings.auth.type !== "none") this.addMiddleware(authenticate());
    // Add JWT Authentication routes only if both JWT Authentication and JWT Authentication routes are set!
    if (
      this.settings.auth.type === "jwt" &&
      this.settings.auth.jwt.routes.enabled === "true"
    )
      this.addHandler(createAuthRoutes());
    // Read all handlers in "/handlers" directory
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
    // Finally, run the HTTP server :)
    this.listen(this.settings.port, () => {
      console.log(`Your API is running on port ${this.settings.port}`);
    });
  },
};
