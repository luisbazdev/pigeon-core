import {
  JWTAuthenticationLogIn,
  JWTAuthenticationSignUp,
  JWTAuthenticationLogOut,
} from "./auth";

import { Pigeon } from "./pigeon";
import { IncomingMessage, ServerResponse } from "node:http";

const env = process.env.ENVIRONMENT === "dev" ? process.env : Pigeon.settings

export const removeSlash = function (path: string) {
  if (path.endsWith("/") && path !== "/") path = path.slice(0, -1);
  return path;
};

export const createAuthRoutes = function () {
  if(!env.DATABASE_MYSQL_HOST || !env.DATABASE_MYSQL_USER || !env.DATABASE_MYSQL_PASSWORD || !env.DATABASE_MYSQL_DATABASE){
    throw new Error("Set up your MySQL database settings correctly!")
  }
  return {
    path: env.AUTHENTICATION_JWT_ROUTES_PATH,
    routes: [
      {
        route: env.AUTHENTICATION_JWT_ROUTES_LOGIN,
        callback: JWTAuthenticationLogIn,
        method: "POST",
        middlewares: [],
      },
      {
        route: env.AUTHENTICATION_JWT_ROUTES_REGISTER,
        callback: JWTAuthenticationSignUp,
        method: "POST",
        middlewares: [],
      },
      {
        route: env.AUTHENTICATION_JWT_ROUTES_LOGOUT,
        callback: JWTAuthenticationLogOut,
        method: "POST",
        middlewares: [],
      },
    ],
    middlewares: [],
  };
};

export const init = function (req: any, res: any) {
  req.get = function (header: string) {
    // if header contains a "-", remove it
    return this.headers[header];
  };
  // also add methods for req (and some more for res)
  res.download = function (_path: string) {
    // Set the Content-Disposition header to force a download with the specified filename
    const filename = "example.mp4";
    res.setHeader("Content-Disposition", "attachment; filename=" + filename);
    /*fs.readFile(__dirname + _path, (error: any, data: any) => {
      if (error) throw error;
      this.end(data);
    });*/
  };
  res.redirect = function (to: string) {
    res.writeHead(302, { Location: to });
    res.end();
  };
  res.set = function (header: string, value: string) {
    this.setHeader(header, value);
    return this;
  };
  res.send = function (val: any) {
    if (typeof val == "object") return this.json(val);
    this.setHeader("Content-Type", "text/html");
    return this.end(val);
  };
  res.sendFile = function (_path: string) {
    // change the header depending on the extension of the file (path.extname(_path))
    /*this.setHeader("Content-Type", "text/css");
    fs.readFile(__dirname + _path, (error: Error, data: any) => {
      if (error) throw error;
      this.end(data);
    });*/
  };
  res.json = function (val: any) {
    this.setHeader("Content-Type", "application/json");
    return this.end(JSON.stringify(val));
  };
  res.status = function (status: number) {
    this.statusCode = status;
    return this;
  };
  res.cookie = function (name: string, value: string, options: any) {
    let { domain, expires, httpOnly, maxAge, path, secure, signed, sameSite } =
      options;

    let cookieString = `${name}=${value};`;
    if (domain) cookieString += ` Domain=${domain};`;
    if (expires) cookieString += ` Expires=${expires};`;
    if (httpOnly) cookieString += ` HttpOnly;`;
    if (maxAge) cookieString += ` Max-Age=${maxAge};`;
    if (path) cookieString += ` Path=${path};`;
    if (secure) cookieString += ` Secure;`;
    if (signed) cookieString += ` Signed;`;
    if (sameSite) cookieString += ` SameSite=${sameSite};`;
    this.setHeader("Set-Cookie", cookieString);

    return this;
  };
  res.set = function (field: string, value: string) {
    this.setHeader(field, value);
    return this;
  };
};

export const getParams = function (route: string, match: any) {
  const paramNames = route
    .split("/")
    .filter((segment) => segment.startsWith(":"))
    .map((segment) => segment.slice(1));
  const paramValues = match.slice(1);
  const paramsObj = paramNames.reduce(
    (params: any, paramName: string, index: number) => {
      params[paramName] = paramValues[index];
      return params;
    },
    {}
  );
  return paramsObj;
};
