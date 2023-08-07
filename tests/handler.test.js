const { createHandler } = require("../build/src/handler");
const handler = createHandler("/users", []);
describe("Handler creation", () => {
  it("should not create a handler with a path with characters other than letters, numbers, '-', '=' and '/'", () => {
    expect(() => createHandler("/users%", [])).toThrow();
    expect(() => createHandler("/users#", [])).toThrow();
    expect(() => createHandler("/users$", [])).toThrow();
    expect(() => createHandler("/users?name=Luis&age=21", [])).toThrow();
    expect(() => createHandler("/users?", [])).toThrow();
    expect(() => createHandler("/users?&", [])).toThrow();
    expect(() => createHandler("/:users", [])).toThrow();
  });
  it("should not create a handler with a path with blank spaces", () => {
    expect(() => createHandler(" ", [])).toThrow();
    expect(() => createHandler("/user s", [])).toThrow();
  });
  it("should not create a handler with an empty path", () => {
    expect(() => createHandler("", [])).toThrow();
  });
  it("should not create a handler with path '/'", () => {
    expect(() => createHandler("/", [])).toThrow();
  });
  it("should not create a handler with path that contains '//'", () => {
    expect(() => createHandler("//users", [])).toThrow();
  });
  it("should not create a handler with a path that does not start with '/'", () => {
    expect(() => createHandler("users/", [])).toThrow();
    expect(() => createHandler("user", [])).toThrow();
  });
  it("should not create a handler with path '/api'", () => {
    expect(() => createHandler("/api", [])).toThrow();
  });
  it("should not create a handler with a path that contains '/' twice", () => {
    expect(() => createHandler("/users/me", [])).toThrow();
    expect(() => createHandler("//users", [])).toThrow();
  });
  it("should not create a handler with a path that ends with '/'", () => {
    expect(() => createHandler("/users/", [])).toThrow();
    expect(() => createHandler("users/", [])).toThrow();
  });
});

// /:userId:id
describe("Handler routes creation", () => {
  it("should not create a handler route with a path with characters other than letters, numbers, ':', '-', '=' and '/'", () => {
    expect(() =>
      handler.createEndpoint("/users/:userId%", () => true, "GET", [])
    ).toThrow();
    expect(() =>
      handler.createEndpoint("/users/:name$", () => true, "GET", [])
    ).toThrow();
    expect(() =>
      handler.createEndpoint("/:userId/:productId", () => true, "GET", [])
    ).not.toThrow();
  });
  it("should not create a handler route with a path that contains '//'", () => {
    expect(() =>
      handler.createEndpoint("//users", () => true, "GET", [])
    ).toThrow();
    expect(() =>
      handler.createEndpoint("/users//me", () => true, "GET", [])
    ).toThrow();
  });
  it("should not create a handler route with a path with blank spaces", () => {
    expect(() => handler.createEndpoint("/ ", () => true, "GET", [])).toThrow();
  });
  it("should not create a handler route with a path that does not start with '/'", () => {
    expect(() =>
      handler.createEndpoint("users", () => true, "GET", [])
    ).toThrow();
  });
  it("should not create a handler route with a path that ends with '/'", () => {
    expect(() =>
      handler.createEndpoint("/users/", () => true, "GET", [])
    ).toThrow();
  });
});
