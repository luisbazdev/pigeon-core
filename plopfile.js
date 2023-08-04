const dotenv = require("dotenv");
dotenv.config();

module.exports = function (plop) {
  const env = process.env.ENVIRONMENT;
  const handlerDir =
    env === "dev" ? "src/handler/{{name}}.ts" : "../../src/handler/{{name}}.ts";
  const middlewareDir =
    env === "dev" ? "src/middleware/{{name}}Middleware.ts" : "../../src/middleware/{{name}}Middleware.ts";
  const repositoryDir =
    env === "dev" ? "src/repository/{{name}}Repository.ts" : "../../src/repository/{{name}}Repository.ts";
  plop.setHelper("eq", function (a, b) {
    return a === b;
  });
  plop.setGenerator("handler", {
    description: "Generate a new handler file",
    prompts: [
      {
        type: "input",
        name: "name",
        message: "What is the root path of your new handler?",
      },
      {
        type: "checkbox",
        name: "methods",
        message: "Which HTTP methods should the handler support?",
        choices: [
          { name: "GET" },
          { name: "POST" },
          { name: "PUT" },
          { name: "DELETE" },
        ],
      },
    ],
    actions: [
      {
        type: "add",
        path: handlerDir,
        templateFile: "src/templates/handler.hbs",
        data: {
          name: "{{name}}",
          route: "{{route}}",
          env
        },
      },
    ],
  });

  plop.setGenerator("middleware", {
    description: "Generate a new middleware file",
    prompts: [
      {
        type: "input",
        name: "name",
        message: "Name of the middleware",
      },
    ],
    actions: [
      {
        type: "add",
        path: middlewareDir,
        templateFile: "src/templates/middleware.hbs",
        data: {
          env
        }
      },
    ],
  });

  plop.setGenerator("repository", {
    description: "Generate a new repository file",
    prompts: [
      {
        type: "input",
        name: "name",
        message: "Name of the repository",
      },
      {
        type: "list",
        name: "database",
        message: "Which database should the repository use?",
        choices: [
          { name: "MySQL", value: "mysql" },
          { name: "MongoDB", value: "mongodb" },
        ],
      },
    ],
    actions: [
      {
        type: "add",
        path: repositoryDir,
        templateFile: "src/templates/repository.hbs",
        data: {
          env
        }
      },
    ],
  });
};
