module.exports = function (plop) {
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
        path: "src/handler/{{name}}.ts",
        templateFile: "src/templates/handler.hbs",
        data: {
          name: "{{name}}",
          route: "{{route}}",
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
        path: "src/middleware/{{name}}Middleware.ts",
        templateFile: "src/templates/middleware.hbs",
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
        path: "src/repository/{{name}}Repository.ts",
        templateFile: "src/templates/repository.hbs",
      },
    ],
  });
}
