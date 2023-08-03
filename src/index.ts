import dotenv from "dotenv";
dotenv.config();

import { Pigeon } from "./pigeon";
import { readdirSync } from "fs";
import { join } from "path";
import { database, MySQLConnection, MongoDBConnection } from "./database";
import { createHandler } from "./handler";
import { bodyMiddleware, cookiesMiddleware } from "./middleware/built";
import { authenticate } from "./auth";
import { createAuthRoutes } from "./util";

/* when building, make npx tsc remove build folder first */

(async function () {
  const env = process.env.ENVIRONMENT === "dev" ? process.env : Pigeon.settings;
  if (env === "prod") {
    const settingsDir = join(process.cwd() + "/build/src", "settings");
    const settings = require(settingsDir);
    Pigeon.addSettings(settings);
  }

  // initialize database
  await database();

  Pigeon.addMiddleware(bodyMiddleware);
  Pigeon.addMiddleware(cookiesMiddleware);

  if (env.AUTHENTICATION_USE != "None") Pigeon.addMiddleware(authenticate());
  else if (
    env.AUTHENTICATION_JWT_ROUTES_ENABLED &&
    env.AUTHENTICATION_USE == "JWT"
  )
    Pigeon.addHandler(createAuthRoutes());

  if (env === "prod") {
    const handlersDir = join(process.cwd() + "/build/src", "handler");
    const repositoriesDir = join(process.cwd() + "/build/src", "repository");
    const middlewareDir = join(process.cwd() + "/build/src", "middleware");

    readdirSync(handlersDir).forEach((file) => {
      if (file.endsWith(".js")) {
        const handler = require(join(handlersDir, file));
        Pigeon.addHandler(Object.keys(handler)[0]);
      }
    });
    readdirSync(repositoriesDir).forEach((file) => {
      if (file.endsWith(".js")) {
        const repository = require(join(repositoriesDir, file));
        Pigeon.addRepository(
          Object.keys(repository)[0],
          repository[Object.keys(repository)[0]]
        );
      }
    });
    readdirSync(middlewareDir)?.forEach((file) => {
      if (file.endsWith(".js")) {
        const middleware = require(join(middlewareDir, file));
        Pigeon.addMiddleware(middleware[Object.keys(middleware)[0]]);
      }
    });
  }

  Pigeon.listen(env.PORT, () => {
    console.log(`Pigeon is listening on port ${env.PORT}`);
  });
})();

export { createHandler, database, MySQLConnection, MongoDBConnection };
