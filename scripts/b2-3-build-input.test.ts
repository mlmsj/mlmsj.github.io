import { describe, expect, it } from "vitest";
import { resolve } from "node:path";
import {
  B2_DEFAULT_SOURCE_MANIFEST,
  readB2SourceManifest,
  resolveB2SourceManifestPath,
} from "./b2-3-build-input";

const root = resolve(import.meta.dirname, "..");

describe("B2-3 controlled source input", () => {
  it("uses the committed fixture and preserves the baseline plus approved high-school theme records", () => {
    expect(resolveB2SourceManifestPath(root)).toBe(
      resolve(root, B2_DEFAULT_SOURCE_MANIFEST),
    );
    const { manifest } = readB2SourceManifest(root);
    expect(manifest.records).toHaveLength(189);
    expect(manifest.records.filter((record) => record.shareUrl === null)).toHaveLength(5);
    expect(manifest.records.filter((record) => record.shareUrl !== null)).toHaveLength(184);
    expect(manifest.records.some((record) => record.title.includes("高考真题"))).toBe(false);
    expect(manifest.records.filter((record) => record.categoryId.startsWith("domain-junior-")).length).toBe(6);
    expect(manifest.records.filter((record) => record.categoryId.startsWith("type-junior-textbooks-")).length).toBe(11);
    expect(manifest.records.filter((record) => record.categoryId.startsWith("type-junior-workbooks-")).length).toBe(13);
    expect(manifest.records.filter((record) => record.categoryId.startsWith("type-junior-exams-")).length).toBe(2);
    expect(manifest.records.filter((record) => record.categoryId.startsWith("type-junior-courses-")).length).toBe(2);
    expect(manifest.records.filter((record) => record.categoryId.startsWith("type-junior-subjects-")).length).toBe(3);
    expect(manifest.records.filter((record) => record.categoryId.startsWith("type-junior-sprint-")).length).toBe(4);
    expect(manifest.records.filter((record) => record.categoryId.startsWith("domain-senior-")).length).toBe(10);
    expect(manifest.records.filter((record) => record.categoryId.startsWith("type-senior-")).length).toBe(62);
    expect(manifest.records.filter((record) => record.categoryId.startsWith("purpose-certification-")).length).toBe(3);
    expect(manifest.records.filter((record) => record.categoryId.startsWith("skill-")).length).toBe(41);
  });

  it("rejects public manifest paths instead of falling back to them", () => {
    expect(() =>
      resolveB2SourceManifestPath(root, "public/data/manifest.v1.json"),
    ).toThrow("B2_SOURCE_MANIFEST_FORBIDDEN");
  });
});
