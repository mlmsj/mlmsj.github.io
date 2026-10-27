import "@testing-library/jest-dom/vitest";

if (!File.prototype.arrayBuffer) {
  Object.defineProperty(File.prototype, "arrayBuffer", {
    configurable: true,
    value: async () => new ArrayBuffer(0),
  });
}
