const { createHandler } = require("../build/src/handler");

describe("Handler creation", () => {
  it("should not create a handler with a path with blank spaces", () => {
    expect(() => createHandler("               ", [])).toThrow();
  });
  it("should not create a handler with an empty path", () => {
    expect(() => createHandler("", [])).toThrow();
  });
  it("should not create a handler with path '/'", () => {
    expect(() => createHandler("/", [])).toThrow();
  });
  it("should not create a handler with a path that does not start with '/'", () => {
    expect(() => createHandler("a/", [])).toThrow();
  });
  it("should not create a handler with path '/api'", () => {
    expect(() => createHandler("/api", [])).toThrow();
  });
  it("should not create a handler with a path that contains '/' twice", () => {
    expect(() => createHandler("/users/me", [])).toThrow();
  });
  it("should not create a handler with a path that ends with '/'", () => {
    expect(() => createHandler("/users/", [])).toThrow();
  });
});

describe("Handler routes creation", () => {
  const handler = createHandler("/users", []);
  it("should not create a handler with a path that contains '/' consecutively twice or more", () => {
    expect(() => handler.createEndpoint("//users", () => true, "GET", [])).toThrow();
    expect(() => handler.createEndpoint("/users//me", () => true, "GET", [])).toThrow();
  });
  it("should not create a handler route with a path with blank spaces", () => {
    expect(() => handler.createEndpoint("/      ", () => true, "GET", [])).toThrow();
  });
  it("should not create a handler route with a path that does not start with '/'", () => {
    expect(() => handler.createEndpoint("users", () => true, "GET", [])).toThrow();
  });
  it("should not create a handler route with a path that ends with '/'", () => {
    expect(() => handler.createEndpoint("/users/", () => true, "GET", [])).toThrow();
  });
});
