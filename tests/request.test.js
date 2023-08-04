describe("Request handling", () => {
    it("should not create a handler with a path with blank spaces", () => {
      expect(() => createHandler("               ", [])).toThrow();
    });
  });