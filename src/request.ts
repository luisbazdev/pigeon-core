import { IncomingMessage } from "node:http";
import { JWTLogInCredentials, JWTSignUpCredentials } from "./interfaces";

declare module "http" {
  interface IncomingMessage {
    get: (header: string) => any;
    body: any;
    cookies: object;
    query: object;
    params: object;
    user: object;
  }
}

IncomingMessage.prototype.get = function (header: string) {
  return this.headers[header];
};

IncomingMessage.prototype.body = {};
IncomingMessage.prototype.cookies = {};
IncomingMessage.prototype.query = {};
IncomingMessage.prototype.params = {};
IncomingMessage.prototype.user = {};