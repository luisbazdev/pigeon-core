const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

import { IncomingMessage, ServerResponse } from "node:http";
import { MySQLConnection } from "./database";
import { Pigeon } from "./pigeon";
import {
  IHandlerFuction,
  IMiddlewareFunction,
  IToken,
  ITokenPayload,
} from "./interfaces";

const env = process.env.ENVIRONMENT === "dev" ? process.env : Pigeon.settings;

const connection = MySQLConnection();

export const authenticate: any = function () {
  if (env.AUTHENTICATION_USE == "None") return;
  switch (env.AUTHENTICATION_USE) {
    case "Basic": {
      return basicHTTPAuthentication;
    }
    case "JWT": {
      return JWTAuthentication;
    }
    default:
      return;
  }
};
export const basicHTTPAuthentication: IMiddlewareFunction = function (
  req: any,
  res: any,
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
        env.AUTHENTICATION_BASIC_USER === username &&
        env.AUTHENTICATION_BASIC_PASSWORD === password
      )
    ) {
      return res
        .status(401)
        .set("WWW-Authenticate", "Basic")
        .end("Wrong Credentials");
    }
  }
  next();
};
export const JWTAuthentication: IMiddlewareFunction = async function (
  req: any,
  res: any,
  next: Function
) {
  const { url } = req;
  if (
    url ==
      env.AUTHENTICATION_JWT_ROUTES_PATH +
        env.AUTHENTICATION_JWT_ROUTES_LOGIN ||
    url ==
      env.AUTHENTICATION_JWT_ROUTES_PATH +
        env.AUTHENTICATION_JWT_ROUTES_REGISTER ||
    url ==
      env.AUTHENTICATION_JWT_ROUTES_PATH + env.AUTHENTICATION_JWT_ROUTES_LOGOUT
  )
    return next();
  if (!req.get("authorization")) {
    return res
      .status(401)
      .json({ message: "Authorization header not present" });
  } else {
    const authorization = req.get("authorization")?.split(" ");
    const type = authorization?.[0];
    if (type != "Bearer")
      res.status(401).json({ message: "Must use Bearer type authentication" });
    const token = authorization?.[1];
    const valid = await JWTVerifyToken(token);
    if (!valid) {
      return res.status(401).json({ message: "Not Valid" });
    }
    const { roles } = valid;
    req.roles = roles;
  }
  next();
};
// give a JWT token to the user
export const JWTAuthenticationLogIn: IHandlerFuction = async function (
  req: any,
  res: any
) {
  const { email, password } = req.body;
  connection.then(async (conn) => {
    // find user
    const [rows, fields] = await conn.query(
      `SELECT * FROM users WHERE email = '${email}'`
    );
    if (rows.length > 0) {
      const match = await bcrypt.compare(password, rows[0].password);
      if (match) {
        const { id } = rows[0];
        const [result, _] = await conn.query(
          `SELECT * FROM user_roles WHERE user_id = ${id};`
        );
        const roles = result.map((obj: any) => obj.role);
        const token = await JWTSignToken({
          name: rows[0].name,
          email,
          roles,
        });
        res.json({ token });
      } else {
        res.send("Wrong password");
      }
    } else {
      res.send("User does not exist");
    }
  });
};
export const JWTAuthenticationSignUp: IHandlerFuction = async function (
  req: any,
  res: any
) {
  const { name, email, password } = req.body;
  const hashedPassword = await bcryptHashPassword(password);
  connection.then(async (conn) => {
    const [users, usersFields] = await conn.query(
      `SELECT * FROM users WHERE email = '${email}'`
    );
    if (users.length > 0) {
      res.status(500).send("User already exists!");
    } else {
      const query = await conn.query(
        `INSERT INTO users (name, email, password) VALUES ('${name}', '${email}', '${hashedPassword}')`
      );
      const { insertId } = query[0];
      // create roles here in database
      await conn.query(
        `INSERT INTO user_roles (user_id, role) VALUES (${insertId}, 'user');`
      );
      res.send("User created successfully!");
    }
  });
};
export const JWTAuthenticationLogOut: IHandlerFuction = function (
  req: any,
  res: any
) {
  const authorization = req.get("authorization")?.split(" ");
  const type = authorization?.[0];
  if (type != "Bearer")
    res.status(401).json({ message: "Must use Bearer type authentication" });
  const token = authorization?.[1];
  const valid = JWTVerifyToken(token);
  //if(!valid) ...
  res.status(200).json({ message: "Successfully logged out" });
  // check if jtw is valid, if it is, remove it from the client
};
export const JWTVerifyToken = async function (token: IToken) {
  try {
    const dec = await jwt.verify(token, env.AUTHENTICATION_JWT_PRIVATEKEY);
    return dec;
  } catch (err) {
    return null;
  }
};

export const JWTSignToken = async function (payload: ITokenPayload) {
  try {
    const asyncToken = await jwt.sign(
      payload,
      env.AUTHENTICATION_JWT_PRIVATEKEY,
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
