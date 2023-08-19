import { ServerResponse } from "node:http";
import { readFile } from "node:fs";
import { getContentType } from "./util";
const path = require('path');

const staticFolder = path.join(__dirname, '..', '..', '..', '..', 'src', 'static');

declare module "http" {
  interface ServerResponse {
    download: (filePath: string) => void;
    redirect: (to: string) => void;
    set: (header: string, value: string) => void;
    send: (value: any) => void;
    sendFile: (filePath: string) => void;
    json: (val: any) => void;
    status: (status: number) => any;
    cookie: (name: string, value: string, options: any) => void;
  }
}

ServerResponse.prototype.download = function (filePath: string) {
  readFile(path.join(staticFolder, filePath),
    (error: any, data: any) => {
      if (error) throw error;
      this.set("Content-Disposition", "attachment; filename=" + filePath);
      this.end(data);
    }
  );
};

ServerResponse.prototype.redirect = function (to: string) {
  this.writeHead(302, { Location: to }).end();
};

ServerResponse.prototype.set = function (header: string, value: string) {
  this.setHeader(header, value);
  return this;
};

ServerResponse.prototype.send = function (value: any) {
  if (typeof value == "object") return this.json(value);
  this.setHeader("Content-Type", "text/html");
  return this.end(value);
};

ServerResponse.prototype.sendFile = function (filePath: string) {
  readFile(
    `${__dirname}../../../static/${filePath}`,
    (error: any, data: any) => {
      if (error) throw error;
      this.setHeader("Content-Type", getContentType(filePath));
      return this.end(data);
    }
  );
};

ServerResponse.prototype.json = function (val: any) {
  this.setHeader("Content-Type", "application/json");
  return this.end(JSON.stringify(val));
};

ServerResponse.prototype.status = function (status: number) {
  this.statusCode = status;
  return this;
};

ServerResponse.prototype.cookie = function (
  name: string,
  value: string,
  options: any
) {
  const cookieOptions: any = {
    Domain: options.domain,
    Expires: options.expires,
    HttpOnly: options.httpOnly,
    "Max-Age": options.maxAge,
    Path: options.path,
    Secure: options.secure,
    Signed: options.signed,
    SameSite: options.sameSite,
  };

  let cookieString = `${name}=${value};`;

  for (const option in cookieOptions) {
    if (cookieOptions[option]) {
      cookieString += ` ${option}=${cookieOptions[option]};`;
    }
  }

  this.setHeader("Set-Cookie", cookieString);

  return this;
};
