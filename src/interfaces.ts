import { Server, IncomingMessage, ServerResponse } from "node:http";
export interface IPigeon {
  middlewares: Array<any>;
  handlers: Array<any>;
  repositories: IRepository[];
  server: Server;
  settings: any;
  listen: (port: string, callback: Function) => void;
  run: (
    appMiddlewares: IMiddlewareFunction[],
    req: IncomingMessage,
    res: ServerResponse
  ) => void;
  handle: (req: IncomingMessage, res: ServerResponse) => any;
  addHandler: (handler: any) => void;
  createHandler: (path: string, middleware?: any[]) => any;
  addRepository: (name: string, repository: IRepository) => void;
  addMiddleware: (middleware: any) => void;
  auth: (type: AuthType, settings?: JWTSettings | HTTPBasicSettings) => void;
  database: (type: DBType, settings: MySQLSettings | MongoDBSettings) => void;
  port: (port: string | number) => void;
  initialize: () => void;
  start: () => void;
}
export interface IToken {
  name: string;
  email: string;
  roles: string[];
  id: string | number;
  iat: number;
  exp: number;
}
export interface ITokenPayload {
  name: string;
  email: string;
  roles: string[];
  id: string | number;
}
export interface IHandler {
  path: string;
  routes: any[];
  middlewares: any[];
  GET: (path: string, func: string, middleware?: any[]) => void;
  POST: (path: string, func: string, middleware?: any[]) => void;
  PUT: (path: string, func: string, middleware?: any[]) => void;
  DELETE: (path: string, func: string, middleware?: any[]) => void;
  createEndpoint: (
    path: string,
    func: string,
    method: string,
    middleware?: any[]
  ) => void;
}
export interface IMiddlewareFunction {
  (req: IncomingMessage, res: ServerResponse, next: Function): void;
}
export interface IHandlerFuction {
  (req: IncomingMessage, res: ServerResponse): any;
}
export interface IRepository {
  name?: string;
  create: (data: any) => any;
  findById: (id: number) => object;
  findAll: () => any;
  update: (id: any, obj: any) => any;
  delete: (id: any, obj: any) => any;
}
export interface ISettings {
  auth: {
    type: string;
    basic: {
      user: string;
      password: string;
    };
    jwt: {
      global: string;
      privateKey: string;
      routes: {
        enabled: string;
        login: string;
        signup: string;
        logout: string;
      };
    };
  };
  db: {
    mysql: {
      enabled: string;
      host: string;
      user: string;
      password: string;
      database: string;
      port: string;
    };
    mongodb: {
      enabled: string;
      url: string;
      db: string;
      collection: string;
    };
  };
  port: string;
}
export type AuthType = "none" | "jwt" | "basic";
export interface JWTSettings {
  global: string;
  privateKey: string;
  routes?: {
    enabled: string;
    // work on validation for these fields
    login: string;
    signup: string;
    logout: string;
  };
}
export interface HTTPBasicSettings {
  user: string;
  password: string;
}
export type DBType = "mysql" | "mongodb";
export interface MySQLSettings {
  enabled?: string;
  host: string;
  user: string;
  password: string;
  database: string;
  port?: string;
}
export interface MongoDBSettings {
  enabled?: string;
  url: string;
  db: string;
  collection: string;
}
export interface JWTLogInCredentials {
  email: string;
  password: string;
}
export interface JWTSignUpCredentials extends JWTLogInCredentials {
  name: string;
}
