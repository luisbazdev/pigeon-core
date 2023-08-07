import {
  JWTAuthenticationLogIn,
  JWTAuthenticationSignUp,
  JWTAuthenticationLogOut,
} from "./auth";

import { Pigeon } from "./pigeon";
import { IncomingMessage, ServerResponse } from "node:http";
import { readFile } from "node:fs";

const env = process.env.ENVIRONMENT === "dev" ? process.env : Pigeon.settings;

export const removeSlash = function (path: string) {
  if (path.endsWith("/") && path !== "/") path = path.slice(0, -1);
  return path;
};

export const createAuthRoutes = function () {
  if (
    !env.DATABASE_MYSQL_HOST ||
    !env.DATABASE_MYSQL_USER ||
    !env.DATABASE_MYSQL_PASSWORD ||
    !env.DATABASE_MYSQL_DATABASE
  ) {
    throw new Error("Set up your MySQL database settings correctly!");
  }
  return {
    path: "/api/auth",
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
    return this.headers[header];
  };
  res.download = function (filePath: string) {
    this.set("Content-Disposition", "attachment; filename=" + filePath);
    readFile(
      `${__dirname}../../../static/${filePath}`,
      (error: any, data: any) => {
        if (error) throw error;
        this.end();
      }
    );
  };
  res.redirect = function (to: string) {
    this.writeHead(302, { Location: to }).end();
  };
  res.set = function (header: string, value: string) {
    this.setHeader(header, value);
    return this;
  };
  res.send = function (value: any) {
    if (typeof value == "object") return this.json(value);
    this.setHeader("Content-Type", "text/html");
    return this.end(value);
  };
  res.sendFile = function (filePath: string) {
    readFile(
      `${__dirname}../../../static/${filePath}`,
      (error: any, data: any) => {
        if (error) throw error;
        this.setHeader("Content-Type", getContentType(filePath));
        return this.end(data);
      }
    );
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

const onlyAllowedHandlerCharacters = /^(?!.*\/\/)[\/a-zA-Z0-9=~\-]+$/;
const onlyAllowedRouteCharacters = /^(?!.*\/\/)[\/a-zA-Z0-9:=~-]+$/;
const containsWhitespaces = /\s/;

const isCharacterRepeated = function (string: string, character: string) {
  var occurrences = string.split(character).length - 1;
  return occurrences > 1;
};

export const isHandlerPathValid = function (handlerPath: string) {
  return (
    onlyAllowedHandlerCharacters.test(handlerPath) &&
    handlerPath != "/api" &&
    handlerPath != "/" &&
    handlerPath &&
    !containsWhitespaces.test(handlerPath) &&
    handlerPath.startsWith("/") &&
    !handlerPath.endsWith("/") &&
    !isCharacterRepeated(handlerPath, "/")
  );
};

export const isHandlerRoutePathValid = function (handlerRoutePath: string) {
  return (
    onlyAllowedRouteCharacters.test(handlerRoutePath) &&
    !containsWhitespaces.test(handlerRoutePath) &&
    handlerRoutePath.startsWith("/") &&
    !handlerRoutePath.endsWith("/")
  );
};

const getContentType = function (path: string) {
  const extension = path.split(".")[1];
  switch (extension) {
    case "mp3": {
      return "audio/mpeg";
    }
    case "wav": {
      return "audio/wav";
    }
    case "ogg": {
      return "audio/ogg";
    }
    case "mp4": {
      return "video/mp4";
    }
    case "ogg": {
      return "video/ogg";
    }
    case "avi": {
      return "video/x-msvideo";
    }
    case "mpeg": {
      return "video/mpeg";
    }
    case "jpg": {
      return "image/jpg";
    }
    case "png": {
      return "image/png";
    }
    case "gif": {
      return "image/gif";
    }
    case "js": {
      return "text/javascript";
    }
    case "css": {
      return "text/css";
    }
    case "html": {
      return "text/html";
    }
    default:
      return "text/html";
  }
};
