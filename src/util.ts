import {
  JWTAuthenticationLogIn,
  JWTAuthenticationSignUp,
  JWTAuthenticationLogOut,
} from "./auth";

import { Pigeon } from "./pigeon";

export const removeSlash = function (path: string | undefined) {
  if (path?.endsWith("/") && path !== "/") path = path?.slice(0, -1);
  return path;
};

export const createAuthRoutes = function () {
  return {
    path: "/api/auth",
    routes: [
      {
        route: Pigeon.settings.auth.jwt.routes.login,
        callback: JWTAuthenticationLogIn,
        method: "POST",
        middlewares: [],
      },
      {
        route: Pigeon.settings.auth.jwt.routes.signup,
        callback: JWTAuthenticationSignUp,
        method: "POST",
        middlewares: [],
      },
      {
        route: Pigeon.settings.auth.jwt.routes.logout,
        callback: JWTAuthenticationLogOut,
        method: "POST",
        middlewares: [],
      },
    ],
    middlewares: [],
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
    handlerPath != "/auth" && 
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

export const getContentType = function (path: string) {
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