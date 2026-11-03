import { describe, expect, it, vi } from "vitest";
import { readPublic, toResource } from "./legacyPublicCatalog";

const record = {
  id: "legacy-resource",
  title: "旧接口资料",
  description: "仅用于 fail-closed 测试",
  categoryId: "stage-university",
  publishedAt: "2026-11-01T00:00:00Z",
  fileType: null,
  sizeBytes: null,
  sourceLabel: null,
};

describe("legacy public catalog compatibility", () => {
  it("does not turn an unscoped legacy record into a public resource", () => {
    expect(toResource(record)).toMatchObject({
      publicationStatus: "draft",
      isPubliclyAccessible: false,
    });
  });

  it("does not call the legacy public endpoint", async () => {
    const fetcher = vi.spyOn(globalThis, "fetch");
    await expect(readPublic("/legacy-resource")).rejects.toThrow("旧公开接口已停用");
    expect(fetcher).not.toHaveBeenCalled();
    fetcher.mockRestore();
  });
});
