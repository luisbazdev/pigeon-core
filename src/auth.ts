const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

import { IncomingMessage, ServerResponse } from "node:http";
import { Pigeon } from "./pigeon";
import {
  IHandlerFuction,
  IMiddlewareFunction,
  IToken,
  ITokenPayload,
} from "./interfaces";
import { PrismaClient } from "@prisma/client";
import { isValidEmail, isValidName, isValidPassword } from "./util";

const prisma = new PrismaClient();
/**
 * This function determines which type of authentication to set in
 * the API based on Pigeon settings.
 */
export const authenticate: any = function () {
  if (Pigeon.settings.auth.type === "none") return;
  switch (Pigeon.settings.auth.type) {
    case "basic": {
      return basicHTTPAuthentication;
    }
    case "jwt": {
      // Only add JWTAuthentication globally if the condition
      // below satisfies, else let the programmer manually
      // add JWTAuthentication to handlers and routes.
      if (Pigeon.settings.auth.jwt.global === "true") {
        return JWTAuthentication;
      }
    }
    default:
      return;
  }
};
/**
 * Middleware function to authenticate request based on HTTP Basic Authentication.
 * @param {IncomingMessage} request - The incoming request object.
 * @param {ServerResponse} response - The server response object.
 * @param {Function} next - The next function to pass control to.
 */
export const basicHTTPAuthentication: IMiddlewareFunction = function (
  request: IncomingMessage,
  response: ServerResponse,
  next: Function
) {
  // If there is no 'Authorization' header present
  if (!request.get("authorization")) {
    return response
      .status(401)
      .set("WWW-Authenticate", "Basic")
      .end("Not Authenticated");
  } else {
    // Decode base64 credentials and store them in
    // username and password variables, respectively
    const credentials = Buffer.from(
      request.get("authorization").split(" ")[1],
      "base64"
    )
      .toString()
      .split(":");
    const username = credentials[0];
    const password = credentials[1];
    if (
      !(
        Pigeon.settings.auth.basic.user === username &&
        Pigeon.settings.auth.basic.password === password
      )
    ) {
      return response.status(401).set("WWW-Authenticate", "Basic").json({
        error:
          "Unauthorized: Access is denied due to invalid credentials. Please check your authentication details and try again.",
      });
    }
  }
  next();
};
/**
 * Middleware function to authenticate request based on JWT Authentication.
 * @param {IncomingMessage} request - The incoming request object.
 * @param {ServerResponse} response - The server response object.
 * @param {Function} next - The next function to pass control to.
 */
export const JWTAuthentication: IMiddlewareFunction = async function (
  request: IncomingMessage,
  response: ServerResponse,
  next: Function
) {
  const { url } = request;
  // If JWT routes are enabled and the request is sent to one of those
  // routes, then skip this middleware!
  if (
    Pigeon.settings.auth.jwt.routes.enabled === "true" &&
    (url == "/api/auth" + Pigeon.settings.auth.jwt.routes.login ||
      url == "/api/auth" + Pigeon.settings.auth.jwt.routes.signup ||
      url == "/api/auth" + Pigeon.settings.auth.jwt.routes.logout)
  )
    return next();
  // If JWT token was not sent
  if (!request.get("authorization")) {
    return response.status(401).json({
      error:
        "Unauthorized: Access is denied due to invalid credentials. Please check your authentication details and try again.",
    });
  } else {
    const authorization = request.get("authorization")?.split(" ");
    const type = authorization?.[0];
    if (type != "Bearer")
      response.status(401).json({
        error:
          "Unauthorized: Access is denied due to invalid credentials. Please check your authentication details and try again.",
      });
    const token = authorization?.[1];
    // Verify the JWT token
    const valid = await JWTVerifyToken(token);
    if (!valid) {
      return response.status(401).json({
        error:
          "Unauthorized: Access is denied due to invalid credentials. Please check your authentication details and try again.",
      });
    }
    // If token is valid, set the user object of the request object
    const user = {
      name: valid.name,
      email: valid.email,
      roles: valid.roles,
      id: valid.id,
    };
    request.user = user;
  }
  next();
};
/**
 * Callback function for JWT Authentication login route.
 * @param {IncomingMessage} request - The incoming request object.
 * @param {ServerResponse} response - The server response object.
 */
export const JWTAuthenticationLogIn: IHandlerFuction = async function (
  request: IncomingMessage,
  response: ServerResponse
) {
  try {
    const { email, password } = request.body;
    // Try to find a user record with the provided email address
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });
    // If user is found
    if (user) {
      const match = await bcrypt.compare(password, user.password);
      if (match) {
        // If the provided password and the user password match,
        // query the user roles
        const { id } = user;
        const roles = await prisma.userRole.findMany({
          where: {
            userId: id,
          },
        });
        const _roles = roles.map((obj: any) => obj.role);
        // Return a signed JWT token containing the name, email, id
        // and roles of the user
        const token = await JWTSignToken({
          name: user.name,
          email,
          roles: _roles,
          id,
        });
        return response.status(200).json({ token });
      }
      return response.status(401).json({
        error: "Invalid credentials. Please check your username and password.",
      });
    }
    return response
      .status(404)
      .json({ error: "User not found. Please check the email you provided." });
  } catch (error) {
    return response
      .status(400)
      .json({ error: "An unexpected error occurred." });
  } finally {
    await prisma.$disconnect();
  }
};
/**
 * Callback function for JWT Authentication sign-up route.
 * @param {IncomingMessage} request - The incoming request object.
 * @param {ServerResponse} response - The server response object.
 */
export const JWTAuthenticationSignUp: IHandlerFuction = async function (
  request: IncomingMessage,
  response: ServerResponse
) {
  try {
    const { name, email, password } = request.body;
    // Verify name, email and password provided by the user
    if (!isValidName(name))
      return response.status(400).json({
        error:
          "Invalid username. Please provide a username between 2 and 6 characters long, containing only alphanumeric characters.",
      });
    if (!isValidEmail(email))
      return response.status(400).json({
        error: "Invalid email address. Please provide a valid email address.",
      });
    if (!isValidPassword(password))
      return response.status(400).json({
        error:
          "Weak password. Please provide a password with a minimum length of 8 characters, at least 1 lowercase letter, 1 uppercase letter, 1 number, and 1 symbol.",
      });
    // If everything is valid, see if user record with the same
    // email address already exists
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });
    if (user) {
      response.status(409).json({
        error: "Email already exists. Please choose a different email.",
      });
    } else {
      // If user does not exist, hash the provided password
      // and create a new user record!
      const hashedPassword = await bcryptHashPassword(password);
      const result = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
        },
      });
      const { id } = result;
      // Also create the "user" role for every new user
      await prisma.userRole.create({
        data: {
          userId: id,
          role: "user",
        },
      });
      response.status(201).end();
    }
  } catch (error) {
    return response
      .status(400)
      .json({ error: "An unexpected error occurred." });
  } finally {
    await prisma.$disconnect();
  }
};
/**
 * Callback function for JWT Authentication log-out route.
 * @param {IncomingMessage} request - The incoming request object.
 * @param {ServerResponse} response - The server response object.
 */
export const JWTAuthenticationLogOut: IHandlerFuction = function (
  req: IncomingMessage,
  res: ServerResponse
) {
  const authorization = req.get("authorization")?.split(" ");
  const type = authorization?.[0];
  if (type != "Bearer")
    res.status(401).json({ message: "Must use Bearer type authentication" });
  const token = authorization?.[1];
  const valid = JWTVerifyToken(token);
  //if(!valid) ...
  res.status(200).end();
  // check if jtw is valid, if it is, remove it from the client
};
export const JWTVerifyToken = async function (token: IToken) {
  try {
    const dec = await jwt.verify(token, Pigeon.settings.auth.jwt.privateKey);
    return dec;
  } catch (err) {
    return null;
  }
};
export const JWTSignToken = async function (payload: ITokenPayload) {
  try {
    const asyncToken = await jwt.sign(
      payload,
      Pigeon.settings.auth.jwt.privateKey,
      {
        algorithm: "HS256",
        expiresIn: "1h",
      }
    );
    return asyncToken;
  } catch (err) {
    return null;
  }
};
const bcryptHashPassword = async function (plainPassword: string) {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(plainPassword, salt);
  return hash;
};
