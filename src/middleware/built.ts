import { IncomingMessage, ServerResponse } from "node:http";
import { IMiddlewareFunction } from "../interfaces";
/**
 * Middleware function that adds body object to request object.
 * @param {IncomingMessage} request - The incoming request object.
 * @param {ServerResponse} response - The server response object.
 * @param {Function} next - The next function to pass control to.
 */
export const bodyMiddleware: IMiddlewareFunction = function (
  request: IncomingMessage,
  response: ServerResponse,
  next: Function
) {
  let { method, headers } = request;
  // If request method is not appropiate then do not add body!
  if (
    method === "GET" ||
    method === "HEAD" ||
    method === "DELETE" ||
    method === "OPTIONS" ||
    method === "TRACE"
  )
    return next();
  // Only JSON body
  if (headers["content-type"] !== "application/json") return next();
  let body = "";

  request.on("data", (chunk: any) => {
    body += chunk.toString();
  });
  request.on("end", () => {
    try {
      request.body = JSON.parse(body);
    } catch (error) {
      return response
        .status(400)
        .json({
          error:
            "The JSON body provided in the request is not valid. Please ensure that the JSON syntax is correct.",
        });
    }
    return next();
  });
};
/**
 * Middleware function that adds cookie object to request object.
 * @param {IncomingMessage} request - The incoming request object.
 * @param {ServerResponse} response - The server response object.
 * @param {Function} next - The next function to pass control to.
 */
export const cookiesMiddleware: IMiddlewareFunction = function (
  request: IncomingMessage,
  response: ServerResponse,
  next: Function
) {
  const cookiesString = request.headers.cookie || "";
  const cookiesArray = cookiesString.split(";");
  request.cookies = cookiesArray.reduce((cookiesObj: any, cookie: any) => {
    const [key, value] = cookie.trim().split("=");
    cookiesObj[key] = value;
    return cookiesObj;
  }, {});
  next();
};
