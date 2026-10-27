import { describe, expect, it } from "vitest";
import { diffSnapshots } from "../diff";
import { findDuplicateCandidates } from "../duplicates";
import type { ProviderFile, Snapshot } from "../types";
import { validateSnapshot } from "../validation";
import { adaptBaiduFileEntry } from "./baidu";
import type { AdapterContext } from "./common";
import { collectSimulatedPages, type CollectContext, type SimulatedPage } from "./pagination";
import { adaptQuarkFileEntry } from "./quark";

const secondsContext: AdapterContext = {
  recordIndex: 0,
  createdTimeFormat: "unix_seconds",
  modifiedTimeFormat: "unix_seconds",
};

const millisecondsContext: AdapterContext = {
  recordIndex: 0,
  createdTimeFormat: "unix_milliseconds",
  modifiedTimeFormat: "unix_milliseconds",
};

const baiduEntry = (overrides: Record<string, unknown> = {}) => ({
  fs_id: "900719925474099312345",
  server_filename: "Fictional Baidu File.pdf",
  path: "/fictional-scope/Fictional Baidu File.pdf",
  isdir: 0,
  category: 4,
  size: 128,
  server_ctime: 1_700_000_000,
  server_mtime: 1_700_000_001,
  ...overrides,
});

const quarkEntry = (overrides: Record<string, unknown> = {}) => ({
  fid: "900719925474099398765",
  parent_fid: "fictional-parent",
  filename: "Fictional Quark File.pdf",
  full_path: "/fictional-scope/Fictional Quark File.pdf",
  file_type: "1",
  category: 4,
  size: 256,
  content_hash: "fictional-custom-hash",
  created_at: 1_700_000_000_000,
  updated_at: 1_700_000_001_000,
  ...overrides,
});

const collectionContext = (
  overrides: Partial<CollectContext> = {},
): CollectContext => ({
  provider: "baidu",
  scanBatchId: "fictional-scan",
  scopeLocatorType: "path",
  scopeLocator: "/fictional-scope",
  permissionScopeFingerprint: "fictional-permission",
  startedAt: "2026-01-01T00:00:00.000Z",
  completedAt: "2026-01-01T00:01:00.000Z",
  maxPages: 2,
  maxItems: 100,
  createdTimeFormat: "unix_seconds",
  modifiedTimeFormat: "unix_seconds",
  toolVersion: "fictional-tool",
  ...overrides,
});

const page = (overrides: Partial<SimulatedPage> = {}): SimulatedPage => ({
  pageNumber: 1,
  cursor: null,
  nextCursor: null,
  entries: [baiduEntry()],
  endOfListing: true,
  permissionScopeFingerprint: "fictional-permission",
  schemaKnown: true,
  ...overrides,
});

const successfulValue = (result: ReturnType<typeof adaptBaiduFileEntry>) => {
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error("fictional adapter fixture failed");
  return result.value;
};

describe("simulated provider adapters", () => {
  it("maps a Baidu-shaped entry conservatively and preserves a large string ID", () => {
    const result = adaptBaiduFileEntry(baiduEntry(), secondsContext);
    expect(result).toMatchObject({
      ok: true,
      value: {
        provider: "baidu",
        providerFileId: "900719925474099312345",
        parentId: null,
        name: "Fictional Baidu File.pdf",
        fileType: "document",
        size: 128,
        hash: null,
        hashAlgorithm: null,
      },
    });
    if (result.ok) {
      expect(result.value.createdAt).toMatchObject({
        rawValue: 1_700_000_000,
        rawFormat: "unix_seconds",
        utcIso: "2023-11-14T22:13:20.000Z",
      });
    }
  });

  it("maps a Quark-shaped entry without claiming a comparable hash algorithm", () => {
    const result = adaptQuarkFileEntry(quarkEntry(), millisecondsContext);
    expect(result).toMatchObject({
      ok: true,
      value: {
        provider: "quark",
        providerFileId: "900719925474099398765",
        parentId: "fictional-parent",
        fileType: "document",
        hash: "fictional-custom-hash",
        hashAlgorithm: null,
      },
    });
    if (result.ok) {
      expect(result.value.modifiedAt.rawFormat).toBe("unix_milliseconds");
    }
  });

  it("keeps the same textual ID separate across providers", () => {
    const baidu = adaptBaiduFileEntry(baiduEntry({ fs_id: "same-id" }), secondsContext);
    const quark = adaptQuarkFileEntry(quarkEntry({ fid: "same-id" }), millisecondsContext);
    expect(baidu.ok && quark.ok && baidu.value.provider !== quark.value.provider).toBe(true);
  });

  it.each([
    ["missing-id", baiduEntry({ fs_id: "" })],
    ["missing-name", baiduEntry({ server_filename: "" })],
    ["invalid-size", baiduEntry({ size: -1 })],
    ["invalid-time", baiduEntry({ server_mtime: "ambiguous" })],
  ])("rejects Baidu-shaped %s without exposing raw values", (code, raw) => {
    expect(adaptBaiduFileEntry(raw, secondsContext)).toEqual({
      ok: false,
      error: { code, recordIndex: 0 },
    });
  });

  it("rejects unsafe numeric IDs instead of losing integer precision", () => {
    expect(
      adaptBaiduFileEntry(baiduEntry({ fs_id: Number.MAX_SAFE_INTEGER + 1 }), secondsContext),
    ).toMatchObject({ ok: false, error: { code: "missing-id" } });
  });

  it("handles missing optional metadata conservatively", () => {
    const baidu = adaptBaiduFileEntry(
      baiduEntry({ path: null, size: null, server_ctime: null, server_mtime: null }),
      secondsContext,
    );
    const quark = adaptQuarkFileEntry(
      quarkEntry({ parent_fid: null, full_path: null, content_hash: null }),
      millisecondsContext,
    );
    expect(baidu).toMatchObject({ ok: true, value: { pathHint: null, size: null } });
    expect(quark).toMatchObject({
      ok: true,
      value: { parentId: null, pathHint: null, hash: null, hashAlgorithm: null },
    });
  });

  it("rejects an undocumented Quark full_path structure instead of guessing", () => {
    expect(adaptQuarkFileEntry(quarkEntry({ full_path: [["id", "name"]] }), millisecondsContext)).toEqual({
      ok: false,
      error: { code: "unsupported-path-shape", recordIndex: 0 },
    });
  });

  it("does not mutate raw provider-shaped input", () => {
    const raw = baiduEntry();
    const copy = structuredClone(raw);
    adaptBaiduFileEntry(raw, secondsContext);
    expect(raw).toEqual(copy);
  });

  it("does not generate strong duplicates from an unknown Quark hash algorithm", () => {
    const first = adaptQuarkFileEntry(quarkEntry({ fid: "a", filename: "A" }), millisecondsContext);
    const second = adaptQuarkFileEntry(quarkEntry({ fid: "b", filename: "B" }), millisecondsContext);
    expect(first.ok && second.ok).toBe(true);
    if (first.ok && second.ok) {
      expect(findDuplicateCandidates([{ file: first.value }, { file: second.value }])).toEqual([]);
    }
  });
});

describe("simulated pagination collection", () => {
  it("collects two pages in stable identity order when the final page explicitly ends", () => {
    const pages = [
      page({
        pageNumber: 1,
        nextCursor: "cursor-2",
        endOfListing: false,
        entries: [baiduEntry({ fs_id: "z" })],
      }),
      page({
        pageNumber: 2,
        cursor: "cursor-2",
        entries: [baiduEntry({ fs_id: "a" })],
      }),
    ];
    const result = collectSimulatedPages(pages, collectionContext(), adaptBaiduFileEntry);
    expect(result.errors).toEqual([]);
    expect(result.snapshot.batch).toMatchObject({
      status: "complete",
      paginationComplete: true,
      scopeComplete: true,
      pagesRead: 2,
      itemsRead: 2,
      stopReason: "completed",
    });
    expect(result.snapshot.files.map(({ providerFileId }) => providerFileId)).toEqual(["a", "z"]);
    expect(validateSnapshot(result.snapshot)).toEqual([]);
  });

  it("accepts an explicitly ended empty directory", () => {
    const result = collectSimulatedPages(
      [page({ entries: [], endOfListing: true })],
      collectionContext(),
      adaptBaiduFileEntry,
    );
    expect(result.snapshot.batch.scopeComplete).toBe(true);
    expect(result.snapshot.files).toEqual([]);
  });

  it("does not call an exact page or item limit complete without explicit end evidence", () => {
    const pageLimited = collectSimulatedPages(
      [page({ endOfListing: false, nextCursor: "more" })],
      collectionContext({ maxPages: 1 }),
      adaptBaiduFileEntry,
    );
    const itemLimited = collectSimulatedPages(
      [page({ entries: [baiduEntry({ fs_id: "a" })], endOfListing: false, nextCursor: "more" })],
      collectionContext({ maxItems: 1 }),
      adaptBaiduFileEntry,
    );
    expect(pageLimited.snapshot.batch).toMatchObject({ status: "partial", scopeComplete: false, stopReason: "max_pages" });
    expect(itemLimited.snapshot.batch).toMatchObject({ status: "partial", scopeComplete: false, stopReason: "max_items" });
  });

  it.each([
    ["duplicate-page", [page({ endOfListing: false, nextCursor: "c2" }), page({ pageNumber: 1 })]],
    ["missing-page", [page({ endOfListing: false, nextCursor: "c2" }), page({ pageNumber: 3 })]],
    ["cursor-loop", [page({ cursor: "same", nextCursor: "same", endOfListing: false })]],
    ["permission-changed", [page({ permissionScopeFingerprint: "different" })]],
    ["unknown-schema", [page({ schemaKnown: false })]],
    ["provider-error", [page({ errorCode: "fictional-error" })]],
    ["timeout", [page({ timedOut: true })]],
  ])("keeps %s scans incomplete", (code, pages) => {
    const result = collectSimulatedPages(pages, collectionContext(), adaptBaiduFileEntry);
    expect(result.errors[0].code).toBe(code);
    expect(result.snapshot.batch.scopeComplete).toBe(false);
    expect(result.snapshot.batch.paginationComplete).toBe(false);
  });

  it("rejects duplicate file identities without leaking their values", () => {
    const result = collectSimulatedPages(
      [page({ entries: [baiduEntry(), baiduEntry()] })],
      collectionContext(),
      adaptBaiduFileEntry,
    );
    expect(result.errors).toEqual([{ code: "duplicate-identity", recordIndex: 1 }]);
    expect(JSON.stringify(result.errors)).not.toContain("900719925474099312345");
  });

  it("feeds complete and partial snapshots safely into the existing diff", () => {
    const originalFile = successfulValue(adaptBaiduFileEntry(baiduEntry(), secondsContext));
    const previous: Snapshot = {
      batch: collectSimulatedPages([page()], collectionContext({ scanBatchId: "previous" }), adaptBaiduFileEntry).snapshot.batch,
      files: [originalFile],
    };
    const complete = collectSimulatedPages(
      [page({ entries: [baiduEntry({ fs_id: "new-id" })] })],
      collectionContext({ scanBatchId: "complete" }),
      adaptBaiduFileEntry,
    ).snapshot;
    const partial = collectSimulatedPages(
      [page({ entries: [], endOfListing: false, nextCursor: "more" })],
      collectionContext({ scanBatchId: "partial", maxPages: 1 }),
      adaptBaiduFileEntry,
    ).snapshot;

    expect(diffSnapshots(previous, complete).some(({ changeType }) => changeType === "missing_candidate")).toBe(true);
    expect(diffSnapshots(previous, partial).some(({ changeType }) => changeType === "missing_candidate")).toBe(false);
  });

  it("keeps collection inputs unchanged", () => {
    const pages = [page()];
    const copy = structuredClone(pages);
    collectSimulatedPages(pages, collectionContext(), adaptBaiduFileEntry);
    expect(pages).toEqual(copy);
  });

  it("produces a Quark snapshot using an FID scope only in simulation", () => {
    const result = collectSimulatedPages(
      [page({ entries: [quarkEntry()] })],
      collectionContext({
        provider: "quark",
        scopeLocatorType: "provider_id",
        scopeLocator: "fictional-folder-fid",
        createdTimeFormat: "unix_milliseconds",
        modifiedTimeFormat: "unix_milliseconds",
      }),
      adaptQuarkFileEntry,
    );
    expect(result.snapshot.batch).toMatchObject({ provider: "quark", scopeLocatorType: "provider_id" });
    expect((result.snapshot.files[0] as ProviderFile).provider).toBe("quark");
  });
});
