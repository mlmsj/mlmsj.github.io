import { describe, expect, it } from "vitest";
import { diffSnapshots } from "./diff";
import { findDuplicateCandidates } from "./duplicates";
import {
  identityKeyForFile,
  normalizeProviderFile,
  normalizeTimestamp,
} from "./normalize";
import type {
  CatalogResourceDraft,
  ProviderFile,
  ScanBatch,
  Snapshot,
} from "./types";
import {
  validateCatalogDraft,
  validateScanBatch,
  validateSnapshot,
} from "./validation";

const time = (value = 1_700_000_000) =>
  normalizeTimestamp(value, "unix_seconds");

const file = (overrides: Partial<ProviderFile> = {}): ProviderFile => ({
  provider: "baidu",
  providerFileId: "file-a",
  parentId: "folder-a",
  pathHint: "/anonymous/file-a.pdf",
  name: "Anonymous A.pdf",
  fileType: "document",
  size: 100,
  hash: "hash-a",
  hashAlgorithm: "sha256",
  createdAt: time(),
  modifiedAt: time(),
  ...overrides,
});

const batch = (overrides: Partial<ScanBatch> = {}): ScanBatch => ({
  scanBatchId: "batch-a",
  provider: "baidu",
  scopeLocatorType: "path",
  scopeLocator: "/anonymous",
  recursive: false,
  startedAt: "2026-01-01T00:00:00.000Z",
  completedAt: "2026-01-01T00:01:00.000Z",
  maxPages: 5,
  maxItems: 100,
  pagesRead: 1,
  itemsRead: 1,
  paginationComplete: true,
  stopReason: "completed",
  permissionScopeFingerprint: "permission-a",
  status: "complete",
  scopeComplete: true,
  toolVersion: "fictional-1",
  ...overrides,
});

const snapshot = (
  files: readonly ProviderFile[],
  batchOverrides: Partial<ScanBatch> = {},
): Snapshot => ({ batch: batch(batchOverrides), files });

describe("offline catalog normalization and validation", () => {
  it("normalizes known timestamp units while preserving raw evidence", () => {
    expect(normalizeTimestamp(1_700_000_000, "unix_seconds")).toEqual({
      utcIso: "2023-11-14T22:13:20.000Z",
      rawValue: 1_700_000_000,
      rawFormat: "unix_seconds",
      conversionVersion: "1",
    });
    expect(normalizeTimestamp(1_700_000_000_000, "unix_milliseconds").utcIso).toBe(
      "2023-11-14T22:13:20.000Z",
    );
    expect(normalizeTimestamp("not-a-date", "iso").utcIso).toBeNull();
  });

  it("normalizes a copy without mutating private input metadata", () => {
    const input = file({ providerFileId: " file-a ", name: " Anonymous A.pdf ", hashAlgorithm: " SHA256 " });
    const normalized = normalizeProviderFile(input);

    expect(normalized.providerFileId).toBe("file-a");
    expect(normalized.hashAlgorithm).toBe("sha256");
    expect(input.providerFileId).toBe(" file-a ");
  });

  it("rejects duplicate identities, negative size, invalid time, and provider mismatch", () => {
    const invalid = file({
      size: -1,
      createdAt: { ...time(), utcIso: "invalid" },
      provider: "quark",
    });
    const issues = validateSnapshot(snapshot([invalid, invalid])).map(({ code }) => code);

    expect(issues).toContain("invalid-size");
    expect(issues).toContain("invalid-created-time");
    expect(issues).toContain("provider-mismatch");
    expect(issues).toContain("duplicate-identity");
  });

  it("forces capped scans to remain partial and incomplete", () => {
    expect(
      validateScanBatch(
        batch({
          status: "partial",
          stopReason: "max_pages",
          paginationComplete: false,
          scopeComplete: false,
        }),
      ),
    ).toEqual([]);
    expect(validateScanBatch(batch({ stopReason: "max_items" })).map(({ code }) => code)).toContain(
      "invalid-scope-completeness",
    );
  });

  it("keeps catalog drafts permanently non-published", () => {
    const draft: CatalogResourceDraft = {
      draftId: "draft-a",
      title: "Anonymous resource",
      categoryId: null,
      reviewStatus: "pending",
      copyrightStatus: "unknown",
      publicationStatus: "draft",
    };
    expect(validateCatalogDraft(draft)).toEqual([]);
  });
});

describe("snapshot diff", () => {
  it("uses provider and provider ID together as identity", () => {
    expect(identityKeyForFile(file())).toBe("baidu:file-a");
    expect(identityKeyForFile(file({ provider: "quark" }))).toBe("quark:file-a");
  });

  it("reports added records in stable order", () => {
    const current = snapshot(
      [file({ providerFileId: "z" }), file({ providerFileId: "a" })],
      { scanBatchId: "batch-b", itemsRead: 2 },
    );
    expect(diffSnapshots(snapshot([]), current).map(({ identityRef, changeType }) => [identityRef, changeType])).toEqual([
      ["baidu:a", "added"],
      ["baidu:z", "added"],
    ]);
  });

  it("emits both location and content changes for one identity", () => {
    const before = file();
    const after = file({ name: "Anonymous renamed.pdf", parentId: "folder-b", hash: "hash-b" });
    const diffs = diffSnapshots(
      snapshot([before]),
      snapshot([after], { scanBatchId: "batch-b" }),
    );

    expect(diffs.map(({ changeType }) => changeType)).toEqual(["changed", "renamed_or_moved"]);
    expect(diffs.find(({ changeType }) => changeType === "renamed_or_moved")?.changedFields).toEqual([
      "name",
      "parentId",
    ]);
  });

  it("uses size changes as reliable content evidence", () => {
    const diffs = diffSnapshots(
      snapshot([file()]),
      snapshot([file({ size: 101 })], { scanBatchId: "batch-b" }),
    );
    expect(diffs).toMatchObject([{ changeType: "changed", changedFields: ["size"] }]);
  });

  it("sends time-only and incomparable hash changes to review", () => {
    const after = file({
      hashAlgorithm: "provider-custom",
      modifiedAt: normalizeTimestamp(1_700_000_001_000, "unix_milliseconds"),
    });
    const diffs = diffSnapshots(
      snapshot([file()]),
      snapshot([after], { scanBatchId: "batch-b" }),
    );
    expect(diffs).toMatchObject([{ changeType: "needs_review", confidence: "low" }]);
  });

  it("only emits a missing candidate for complete comparable scans", () => {
    const before = snapshot([file()]);
    const completeCurrent = snapshot([], { scanBatchId: "batch-b", itemsRead: 0 });
    const partialCurrent = snapshot([], {
      scanBatchId: "batch-c",
      itemsRead: 0,
      status: "partial",
      stopReason: "max_pages",
      paginationComplete: false,
      scopeComplete: false,
    });

    expect(diffSnapshots(before, completeCurrent)[0].changeType).toBe("missing_candidate");
    expect(diffSnapshots(before, partialCurrent)[0].changeType).toBe("unknown");
  });

  it.each([
    { scopeLocator: "/different" },
    { recursive: true },
    { permissionScopeFingerprint: "different-permission" },
    { provider: "quark" as const },
  ])("rejects an incompatible scope or permission: %o", (change) => {
    const currentFile = change.provider ? file({ provider: change.provider }) : file();
    const diffs = diffSnapshots(
      snapshot([file()]),
      snapshot([currentFile], { scanBatchId: "batch-b", ...change }),
    );
    expect(diffs.every(({ changeType }) => changeType === "unknown")).toBe(true);
  });

  it("requires explicit prior missing evidence for restored", () => {
    const current = snapshot([file()], { scanBatchId: "batch-b" });
    expect(diffSnapshots(snapshot([]), current)[0].changeType).toBe("added");
    expect(
      diffSnapshots(snapshot([]), current, {
        previousMissingIdentityRefs: new Set(["baidu:file-a"]),
      })[0].changeType,
    ).toBe("restored");
  });

  it("does not mutate either input snapshot", () => {
    const previous = snapshot([file()]);
    const current = snapshot([file({ size: 101 })], { scanBatchId: "batch-b" });
    const previousCopy = structuredClone(previous);
    const currentCopy = structuredClone(current);
    diffSnapshots(previous, current);
    expect(previous).toEqual(previousCopy);
    expect(current).toEqual(currentCopy);
  });
});

describe("duplicate candidates", () => {
  it("creates a strong cross-provider candidate for a comparable hash", () => {
    const candidates = findDuplicateCandidates([
      { file: file() },
      { file: file({ provider: "quark", providerFileId: "file-b" }) },
    ]);
    expect(candidates).toMatchObject([
      { confidence: "high", reasonCode: "same_comparable_hash", requiresReview: true },
    ]);
  });

  it("creates a weak candidate from normalized name and size without hashes", () => {
    const candidates = findDuplicateCandidates([
      { file: file({ hash: null, hashAlgorithm: null, name: " Test  File.pdf " }) },
      {
        file: file({
          provider: "quark",
          providerFileId: "file-b",
          hash: null,
          hashAlgorithm: null,
          name: "test file.pdf",
        }),
      },
    ]);
    expect(candidates[0]).toMatchObject({
      confidence: "low",
      reasonCode: "same_size_and_normalized_name",
    });
  });

  it("does not compare different hash algorithms or incompatible year/version metadata", () => {
    const differentAlgorithm = findDuplicateCandidates([
      { file: file({ hashAlgorithm: "sha256", name: "A" }) },
      { file: file({ provider: "quark", providerFileId: "b", hashAlgorithm: "md5", name: "B" }) },
    ]);
    const incompatibleMetadata = findDuplicateCandidates([
      { file: file({ hash: null, hashAlgorithm: null }), year: "2025", version: "v1" },
      {
        file: file({ provider: "quark", providerFileId: "b", hash: null, hashAlgorithm: null }),
        year: "2026",
        version: "v2",
      },
    ]);
    expect(differentAlgorithm).toEqual([]);
    expect(incompatibleMetadata).toEqual([]);
  });

  it("handles a large bucketed fixture without producing an unbounded all-pairs result", () => {
    const values = Array.from({ length: 2_000 }, (_, index) => ({
      file: file({
        providerFileId: `file-${index}`,
        name: `Anonymous ${index}.pdf`,
        size: index,
        hash: null,
        hashAlgorithm: null,
      }),
    }));
    expect(findDuplicateCandidates(values)).toEqual([]);
  });
});
