const { Pigeon } = require("../build/src/pigeon")
const handler = Pigeon.createHandler("/users", []);
describe("Handler creation", () => {
  it("should not create a handler with a path with characters other than letters, numbers, '-', '=' and '/'", () => {
    expect(() => Pigeon.createHandler("/users%", [])).toThrow();
    expect(() => Pigeon.createHandler("/users#", [])).toThrow();
    expect(() => Pigeon.createHandler("/users$", [])).toThrow();
    expect(() => Pigeon.createHandler("/users?name=Luis&age=21", [])).toThrow();
    expect(() => Pigeon.createHandler("/users?", [])).toThrow();
    expect(() => Pigeon.createHandler("/users?&", [])).toThrow();
    expect(() => Pigeon.createHandler("/:users", [])).toThrow();
  });
  it("should not create a handler with a path with blank spaces", () => {
    expect(() => Pigeon.createHandler(" ", [])).toThrow();
    expect(() => Pigeon.createHandler("/user s", [])).toThrow();
  });
  it("should not create a handler with an empty path", () => {
    expect(() => Pigeon.createHandler("", [])).toThrow();
  });
  it("should not create a handler with path '/'", () => {
    expect(() => Pigeon.createHandler("/", [])).toThrow();
  });
  it("should not create a handler with path that contains '//'", () => {
    expect(() => Pigeon.createHandler("//users", [])).toThrow();
  });
  it("should not create a handler with a path that does not start with '/'", () => {
    expect(() => Pigeon.createHandler("users/", [])).toThrow();
    expect(() => Pigeon.createHandler("user", [])).toThrow();
  });
  it("should not create a handler with path '/api'", () => {
    expect(() => Pigeon.createHandler("/api", [])).toThrow();
  });
  it("should not create a handler with a path that contains '/' twice", () => {
    expect(() => Pigeon.createHandler("/users/me", [])).toThrow();
    expect(() => Pigeon.createHandler("//users", [])).toThrow();
  });
  it("should not create a handler with a path that ends with '/'", () => {
    expect(() => Pigeon.createHandler("/users/", [])).toThrow();
    expect(() => Pigeon.createHandler("users/", [])).toThrow();
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
