import dotenv from "dotenv";
dotenv.config();

import { Pigeon } from "./pigeon";
import { database, MySQLConnection, MongoDBConnection } from "./database";
import { createHandler } from "./handler";
import { bodyMiddleware, cookiesMiddleware } from "./middleware/built";
import { authenticate } from "./auth";
import { createAuthRoutes } from "./util";

(async function () {
  // initialize database
  await database();

  Pigeon.addMiddleware(bodyMiddleware);
  Pigeon.addMiddleware(cookiesMiddleware);

  if (Pigeon.settings.auth.type !== "None") Pigeon.addMiddleware(authenticate());
  if (
    Pigeon.settings.auth.type === "JWT" &&
    Pigeon.settings.auth.jwt.routes.enabled
  )
    Pigeon.addHandler(createAuthRoutes());

  Pigeon.listen(Pigeon.settings.port, () => {
    console.log(`Pigeon is listening on port ${Pigeon.settings.port}`);
  });
})();
export { Pigeon, createHandler, database, MySQLConnection, MongoDBConnection };
export * from './interfaces';