import { describe, expect, it } from "vitest";
import { resolve } from "node:path";
import {
  B2_DEFAULT_SOURCE_MANIFEST,
  readB2SourceManifest,
  resolveB2SourceManifestPath,
} from "./b2-3-build-input";

const root = resolve(import.meta.dirname, "..");

describe("B2-3 controlled source input", () => {
  it("uses the committed fixture and preserves the 26-record baseline plus approved high-school and junior records", () => {
    expect(resolveB2SourceManifestPath(root)).toBe(
      resolve(root, B2_DEFAULT_SOURCE_MANIFEST),
    );
    const { manifest } = readB2SourceManifest(root);
    expect(manifest.records).toHaveLength(37);
    expect(manifest.records.filter((record) => record.shareUrl === null)).toHaveLength(13);
    expect(manifest.records.filter((record) => record.shareUrl !== null)).toHaveLength(24);
    expect(manifest.records.filter((record) => record.categoryId === "exam-senior-gaokao")).toHaveLength(5);
    expect(manifest.records.filter((record) => record.categoryId.startsWith("domain-junior-")).length).toBe(6);
  });

  it("rejects public manifest paths instead of falling back to them", () => {
    expect(() =>
      resolveB2SourceManifestPath(root, "public/data/manifest.v1.json"),
    ).toThrow("B2_SOURCE_MANIFEST_FORBIDDEN");
  });
});
