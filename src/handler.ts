import { IHandler } from "./interfaces";
import { removeSlash } from "./util";

// This function creates new route handlers and add it to Pigeon object handlers array
export const createHandler: any = function (path: string, middleware?: any[]) {
  // if middlewares not an array: throw new Error("You must provide an array of middlewares!")
  const routes = path.split("/")
  const whitespaces = path.includes(" ")
  const api = routes[1] === "api"
  if (whitespaces || !path || path === "/" || !path.startsWith("/") || api || path.endsWith("/") || (path.split("/").length - 1) != 1)
    throw new Error("Handler route is not valid!");
  const handler: IHandler = {
    // remove further slashes... "/api/..."
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
      // asearch the route by regex for custom params
      const containsDoubleSlashes = path.split("//").length != 1
      const whitespaces = path.includes(" ")
      if (containsDoubleSlashes || whitespaces || !path || !path.startsWith("/") || path.endsWith("/"))
        throw new Error("Handler route is not valid!");
        
      if (!path || path === " " || path[0] !== "/")
        throw new Error("Handler route is not valid!");
      if(path === "/")
        path = ""
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
