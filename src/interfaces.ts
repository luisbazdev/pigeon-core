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
  addRepository: (name: string, repository: IRepository) => void;
  addMiddleware: (middleware: any) => void;
  addSettings: (settings: any) => void;
}
export interface IToken {
  name: string;
  email: string;
  roles: string[];
  iat: number;
  exp: number;
}
export interface ITokenPayload {
  name: string;
  email: string;
  roles: string[];
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
  create?: (data: any) => any;
  findById?: (id: number) => object;
  findAll?: () => any;
  update?: (id: any, obj: any) => any;
  delete?: (id: any, obj: any) => any;
}
