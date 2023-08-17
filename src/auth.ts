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
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient();

export const authenticate: any = function () {
  if (Pigeon.settings.auth.type === "none") return;
  switch (Pigeon.settings.auth.type) {
    case "basic": {
      return basicHTTPAuthentication;
    }
    case "jwt": {
      if (Pigeon.settings.auth.jwt.global === "true") {
        return JWTAuthentication;
      }
    }
    default:
      return;
  }
};
export const basicHTTPAuthentication: IMiddlewareFunction = function (
  req: IncomingMessage,
  res: ServerResponse,
  next: Function
) {
  if (!req.get("authorization")) {
    return res
      .status(401)
      .set("WWW-Authenticate", "Basic")
      .end("Not Authenticated");
  } else {
    const credentials = Buffer.from(
      req.get("authorization").split(" ")[1],
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
      return res
        .status(401)
        .set("WWW-Authenticate", "Basic")
        .json({error: "Unauthorized: Access is denied due to invalid credentials. Please check your authentication details and try again."});
    }
  }
  next();
};
export const JWTAuthentication: IMiddlewareFunction = async function (
  req: IncomingMessage,
  res: ServerResponse,
  next: Function
) {
  const { url } = req;
  if (
    Pigeon.settings.auth.jwt.routes.enabled === "true" &&
    (url == "/api/auth" + Pigeon.settings.auth.jwt.routes.login ||
      url == "/api/auth" + Pigeon.settings.auth.jwt.routes.signup ||
      url == "/api/auth" + Pigeon.settings.auth.jwt.routes.logout)
  )
    return next();
  if (!req.get("authorization")) {
    return res
      .status(401)
      .json({error: "Unauthorized: Access is denied due to invalid credentials. Please check your authentication details and try again."});
  } else {
    const authorization = req.get("authorization")?.split(" ");
    const type = authorization?.[0];
    if (type != "Bearer")
      res.status(401).json({error: "Unauthorized: Access is denied due to invalid credentials. Please check your authentication details and try again."});
    const token = authorization?.[1];
    const valid = await JWTVerifyToken(token);
    if (!valid) {
      return res.status(401).json({error: "Unauthorized: Access is denied due to invalid credentials. Please check your authentication details and try again."});
    }
    const user = {
      name: valid.name,
      email: valid.email,
      roles: valid.roles,
      id: valid.id,
    };
    req.user = user;
  }
  next();
};
// give a JWT token to the user
export const JWTAuthenticationLogIn: IHandlerFuction = async function (
  req: IncomingMessage,
  res: ServerResponse
) {
  const { email, password } = req.body;
  // find user
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });
  if (user) {
    const match = await bcrypt.compare(password, user.password);
    if (match) {
      const { id } = user;
      const roles = await prisma.userRole.findMany({
        where: {
          userId: id
        }
      })
      const _roles = roles.map((obj: any) => obj.role);
      const token = await JWTSignToken({
        name: user.name,
        email,
        roles: _roles,
        id,
      });
      res.status(200).json({ token });
    } else {
      res.status(401).json({error: "Invalid credentials. Please check your username and password."});
    }
  } else {
    res.status(404).json({error: "User not found. Please check the email you provided."})
  }
};
export const JWTAuthenticationSignUp: IHandlerFuction = async function (
  req: IncomingMessage,
  res: ServerResponse
) {
  const { name, email, password } = req.body;
  const hashedPassword = await bcryptHashPassword(password);
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });
  if (user) {
    res.status(409).json({error: "Email already exists. Please choose a different email."})
  } else {
    const result = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      }
    });
    const { id } = result;
    // create roles here in database
    await prisma.userRole.create({
      data: {
        userId: id,
        role: "user"
      }
    })
    res.status(201).end()
  }
};
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
  res.status(200).end()
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
