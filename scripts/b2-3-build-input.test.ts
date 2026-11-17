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
    expect(manifest.records).toHaveLength(310);
    expect(manifest.records.filter((record) => record.shareUrl === null)).toHaveLength(5);
    expect(manifest.records.filter((record) => record.shareUrl !== null)).toHaveLength(305);
    expect(manifest.records.some((record) => record.title.includes("高考真题"))).toBe(false);
    expect(manifest.records.filter((record) => record.categoryId.startsWith("domain-junior-")).length).toBe(6);
    expect(manifest.records.filter((record) => record.categoryId.startsWith("type-junior-textbooks-")).length).toBe(11);
    expect(manifest.records.filter((record) => record.categoryId.startsWith("type-junior-workbooks-")).length).toBe(13);
    expect(manifest.records.filter((record) => record.categoryId.startsWith("type-junior-exams-")).length).toBe(2);
    expect(manifest.records.filter((record) => record.categoryId.startsWith("type-junior-courses-")).length).toBe(2);
    expect(manifest.records.filter((record) => record.categoryId.startsWith("type-junior-subjects-")).length).toBe(3);
    expect(manifest.records.filter((record) => record.categoryId.startsWith("type-junior-sprint-")).length).toBe(4);
    expect(manifest.records.filter((record) => record.categoryId.startsWith("domain-senior-")).length).toBe(10);
    expect(manifest.records.filter((record) => record.categoryId.startsWith("type-senior-")).length).toBe(130);
    expect(manifest.records.filter((record) => record.categoryId.startsWith("purpose-certification-")).length).toBe(16);
    expect(manifest.records.filter((record) => record.categoryId.startsWith("skill-")).length).toBe(48);

    const baiduAiCandidates = manifest.records.filter((record) =>
      record.id.startsWith("ai-baidu-"),
    );
    expect(baiduAiCandidates).toHaveLength(7);
    const baiduAiCategories = new Map([
      ["ai-baidu-office-001", "skill-ai-office"],
      ["ai-baidu-photography-001", "skill-ai-photography"],
      ["ai-baidu-painting-001", "skill-ai-painting"],
      ["ai-baidu-aigc-001", "skill-ai-aigc"],
      ["ai-baidu-self-media-001", "skill-ai-self-media"],
      ["ai-baidu-intro-001", "skill-ai-learning-cognition"],
      ["ai-baidu-chatgpt-001", "skill-ai-chatgpt"],
    ]);
    expect(baiduAiCandidates.every((record) =>
      record.provider === "baidu" &&
      baiduAiCategories.get(record.id) === record.categoryId &&
      record.shareUrl !== null &&
      record.shareUrl.includes("?pwd=") &&
      record.passcode === undefined &&
      record.accessStatus === "verified" &&
      record.checkedOn === "2026-11-15" &&
      record.fileType === "folder",
    )).toBe(true);
    const secondaryBaiduRecords = manifest.records.filter((record) =>
      record.deliveries?.some((delivery) => delivery.provider === "baidu"),
    );
    expect(secondaryBaiduRecords).toHaveLength(53);
    expect(secondaryBaiduRecords.every((record) =>
      record.provider === "quark" &&
      record.deliveries?.length === 1 &&
      record.deliveries[0]?.provider === "baidu" &&
      record.deliveries[0]?.accessStatus === "verified" &&
      record.deliveries[0]?.checkedOn === "2026-11-17",
    )).toBe(true);
    expect(secondaryBaiduRecords.some((record) => record.id.startsWith("ai-baidu-"))).toBe(false);
    const firstRoundWorkbooks = manifest.records.filter((record) =>
      record.id.startsWith("hs-workbooks-first-round-2027-item-"),
    );
    expect(firstRoundWorkbooks).toHaveLength(61);
    expect(firstRoundWorkbooks.every((record) =>
      record.categoryId === "type-senior-workbooks-first-round-2027" &&
      record.provider === "quark" &&
      record.shareUrl !== null &&
      record.accessStatus === "verified" &&
      record.checkedOn === "2026-11-16" &&
      record.fileType === "folder",
    )).toBe(true);
    const synchronousWorkbooks = manifest.records.filter((record) =>
      record.id.startsWith("hs-workbooks-synchronous-2027-item-"),
    );
    expect(synchronousWorkbooks).toHaveLength(7);
    expect(synchronousWorkbooks.every((record) =>
      record.categoryId === "type-senior-workbooks-synchronous-2027" &&
      record.provider === "quark" &&
      record.shareUrl !== null &&
      record.accessStatus === "verified" &&
      record.checkedOn === "2026-11-16" &&
      record.fileType === "folder",
    )).toBe(true);
    const certificationFirstLevel = manifest.records.filter((record) =>
      record.id.startsWith("university-topic-cet-item-") ||
      record.id.startsWith("university-topic-ielts-item-") ||
      record.id.startsWith("university-topic-computer-item-"),
    );
    expect(certificationFirstLevel).toHaveLength(33);
    expect(certificationFirstLevel.filter((record) =>
      record.id.startsWith("university-topic-cet-item-"),
    )).toHaveLength(6);
    expect(certificationFirstLevel.filter((record) =>
      record.id.startsWith("university-topic-ielts-item-"),
    )).toHaveLength(11);
    expect(certificationFirstLevel.filter((record) =>
      record.id.startsWith("university-topic-computer-item-"),
    )).toHaveLength(16);
    expect(certificationFirstLevel.every((record) =>
      record.provider === "quark" &&
      record.shareUrl !== null &&
      record.accessStatus === "verified" &&
      record.checkedOn === "2026-11-17" &&
      typeof record.fileType === "string",
    )).toBe(true);
    expect(manifest.records.some((record) =>
      record.title.includes("自动查找资料教程"),
    )).toBe(false);
  });

  it("rejects public manifest paths instead of falling back to them", () => {
    expect(() =>
      resolveB2SourceManifestPath(root, "public/data/manifest.v1.json"),
    ).toThrow("B2_SOURCE_MANIFEST_FORBIDDEN");
  });
});
