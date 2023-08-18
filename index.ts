// Add custom method to request and response objects
import "./src/request";
import "./src/response";

import { Pigeon } from "./src/pigeon";
import { basicHTTPAuthentication, JWTAuthentication } from "./src/auth";

export {
  Pigeon,
  basicHTTPAuthentication,
  JWTAuthentication,
};
export * from "./src/interfaces";