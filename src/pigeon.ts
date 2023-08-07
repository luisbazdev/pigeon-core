const http = require("node:http");
const URL = require("node:url");

import { IncomingMessage, ServerResponse } from "node:http";
import { removeSlash, init, getParams } from "./util";
import {
  IHandler,
  IHandlerFuction,
  IMiddlewareFunction,
  IPigeon,
  IRepository,
} from "./interfaces";

export let Pigeon: IPigeon = {
  middlewares: [],
  handlers: [],
  repositories: [],
  server: http.createServer((req: IncomingMessage, res: ServerResponse) => {
    init(req, res);
    Pigeon.handle(req, res);
  }),
  settings: {},
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
  addRepository: function (name: string, _repository: IRepository) {
    _repository.name = name;
    this.repositories.push(_repository);
  },
  addMiddleware: function (_middleware: IMiddlewareFunction) {
    this.middlewares.push(_middleware);
  },
  addSettings: function (_settings: any) {
    this.settings = _settings;
  },
};
