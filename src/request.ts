import { IncomingMessage } from "node:http";
import { IRequestUser } from "./interfaces";

declare module "http" {
  interface IncomingMessage {
    get: (header: string) => any;
    body: any;
    cookies: any;
    query: any;
    params: any;
    user: IRequestUser;
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