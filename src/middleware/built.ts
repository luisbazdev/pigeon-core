import { IncomingMessage, ServerResponse } from "node:http";
import { IMiddlewareFunction } from "../interfaces";

export const bodyMiddleware: IMiddlewareFunction = function (
  req: IncomingMessage,
  res: ServerResponse,
  next: Function
) {
  let { method, headers } = req;
  if (
    method === "GET" ||
    method === "HEAD" ||
    method === "DELETE" ||
    method === "OPTIONS" ||
    method === "TRACE"
  )
    return next();
  if (headers["content-type"] !== "application/json") return next();
  let body = "";

  req.on("data", (chunk: any) => {
    body += chunk.toString();
  });
  req.on("end", () => {
    req.body = JSON.parse(body);
    return next();
  });
};

export const cookiesMiddleware: IMiddlewareFunction = function (
  req: IncomingMessage,
  res: ServerResponse,
  next: Function
) {
  const cookiesString = req.headers.cookie || "";
  const cookiesArray = cookiesString.split(";");
  req.cookies = cookiesArray.reduce((cookiesObj: any, cookie: any) => {
    const [key, value] = cookie.trim().split("=");
    cookiesObj[key] = value;
    return cookiesObj;
  }, {});
  next();
};
