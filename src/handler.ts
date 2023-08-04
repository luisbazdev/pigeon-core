import { IHandler } from "./interfaces";
import { isHandlerPathValid, isHandlerRoutePathValid } from "./util";
// This function creates new route handlers and add it to Pigeon object handlers array
export const createHandler: any = function (path: string, middleware?: any[]) {
  // if middlewares not an array: throw new Error("You must provide an array of middlewares!")
  if (!isHandlerPathValid(path)) throw new Error("Handler path is invalid!");
  const handler: IHandler = {
    path: "/api" + path,
    routes: [],
    middlewares: middleware ?? [],
    GET: (path, func, middleware?: any[]) => {
      handler.createEndpoint(path, func, "GET", middleware);
    },
    POST: (path, func, middleware?: any[]) => {
      handler.createEndpoint(path, func, "POST", middleware);
    },
    PUT: (path, func, middleware?: any[]) => {
      handler.createEndpoint(path, func, "PUT", middleware);
    },
    DELETE: (path, func, middleware?: any[]) => {
      handler.createEndpoint(path, func, "DELETE", middleware);
    },
    createEndpoint: (path, func, method, middleware?: any[]) => {
      // /users/:userId
      // /users/:id
      if (!isHandlerRoutePathValid(path))
        throw new Error("Handler route path is invalid!");
      if (path === "/") path = "";
      // Search routes with custom params functionality using regex here...
      const rootExists = handler.routes?.find(
        (route) => route.route === path && route.method === method
      );
      if (rootExists) throw new Error("Route already exists for this handler!");
      handler.routes.push({
        route: path,
        callback: func,
        method: method,
        middlewares: middleware ?? [],
      });
    },
  };
  return handler;
};
