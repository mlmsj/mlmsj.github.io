import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { getEnabledCategoryPath } from "./categories";
import {
  loadPublicManifest,
  isAllowedPublicShareUrl,
  parsePublicManifest,
  PUBLIC_MANIFEST_FIELDS,
  PUBLIC_MANIFEST_RECORD_FIELDS,
  PUBLIC_MANIFEST_URL,
  validatePublicManifest,
  type PublicManifest,
} from "./publicManifest";

const validRecord = {
  id: "zwg-fixture-0001",
  title: "合成测试资料",
  description: "仅用于字段校验，不会访问网络。",
  categoryId: "type-junior-math-notes",
  provider: "quark",
  shareUrl: "https://pan.quark.cn/s/fixture-only",
  passcode: "0123",
  accessStatus: "verified",
  checkedOn: "2026-10-17",
  publishedAt: "2026-10-17T16:00:00Z",
  fileType: "pdf",
  sizeBytes: 1024,
} as const;

const validManifest = (): PublicManifest => ({
  schemaVersion: 1,
  generatedAt: "2026-10-17T16:00:00Z",
  records: [validRecord],
});

const codes = (value: unknown) => {
  const result = validatePublicManifest(value);
  return result.ok ? [] : result.issues.map((entry) => entry.code);
};

const responseFor = (body: unknown, ok = true) =>
  ({ ok, json: async () => body }) as Response;

describe("public manifest contract", () => {
  it("accepts the V1 contract and preserves a leading-zero passcode as text", () => {
    const result = validatePublicManifest(validManifest());

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.records[0].passcode).toBe("0123");
    }
  });

  it("accepts an independent synthetic empty manifest through validation, parsing and loading", async () => {
    const emptyManifest: PublicManifest = {
      schemaVersion: 1,
      generatedAt: "2026-10-17T16:00:00Z",
      records: [],
    };

    expect(validatePublicManifest(emptyManifest).ok).toBe(true);
    expect(parsePublicManifest(emptyManifest).records).toHaveLength(0);
    const loaded = await loadPublicManifest(async () => responseFor(emptyManifest));
    expect(loaded.records).toHaveLength(0);
  });

  it("rejects unknown fields, duplicate IDs and invalid categories", () => {
    const first = validRecord;
    const second = { ...validRecord, title: "第二条合成资料" };
    expect(
      codes({
        ...validManifest(),
        extra: "not public schema",
        records: [
          { ...first, privateNote: "must not enter public manifest" },
          second,
        ],
      }),
    ).toEqual(
      expect.arrayContaining(["UNKNOWN_FIELD", "DUPLICATE_ID"]),
    );

    expect(
      codes({
        ...validManifest(),
        records: [{ ...validRecord, categoryId: "missing-category" }],
      }),
    ).toContain("INVALID_CATEGORY");
  });

  it("rejects non-HTTPS, wrong-host, credential-bearing, query and wrong-provider URLs", () => {
    expect(isAllowedPublicShareUrl("quark", "http://pan.quark.cn/s/a")).toBe(false);
    expect(isAllowedPublicShareUrl("quark", "//pan.quark.cn/s/a")).toBe(false);
    expect(isAllowedPublicShareUrl("quark", "https://evilpan.quark.cn/s/a")).toBe(false);
    expect(isAllowedPublicShareUrl("quark", "https://pan.quark.cn.evil/s/a")).toBe(false);
    expect(isAllowedPublicShareUrl("quark", "https://pan.quark.cn./s/a")).toBe(false);
    expect(isAllowedPublicShareUrl("quark", "https://user:pass@pan.quark.cn/s/a")).toBe(false);
    expect(isAllowedPublicShareUrl("quark", "https://user@pan.quark.cn/s/a")).toBe(false);
    expect(isAllowedPublicShareUrl("quark", "https://pan.quark.cn:443/s/a")).toBe(false);
    expect(isAllowedPublicShareUrl("quark", "https://pan.quark.cn:8443/s/a")).toBe(false);
    expect(isAllowedPublicShareUrl("quark", "https://pan.quark.cn/s/a?pwd=1234")).toBe(false);
    expect(isAllowedPublicShareUrl("quark", "https://pan.quark.cn/s/a#fragment")).toBe(false);
    expect(isAllowedPublicShareUrl("quark", "https://pan.baidu.com/s/a")).toBe(false);
    expect(isAllowedPublicShareUrl("quark", "HTTPS://PAN.QUARK.CN/s/a")).toBe(true);
    expect(isAllowedPublicShareUrl("baidu", "https://pan.baidu.com/s/a")).toBe(true);
  });

  it("rejects whitespace, control characters, backslashes, encoded and invalid paths, and long URLs", () => {
    expect(isAllowedPublicShareUrl("quark", " https://pan.quark.cn/s/a")).toBe(false);
    expect(isAllowedPublicShareUrl("quark", "https://pan.quark.cn/s/a ")).toBe(false);
    expect(isAllowedPublicShareUrl("quark", "https://pan.quark.cn/s/a\n")).toBe(false);
    expect(isAllowedPublicShareUrl("quark", "https://pan.quark.cn/s/a\\b")).toBe(false);
    expect(isAllowedPublicShareUrl("quark", "https://pan.quark.cn/s/%61")).toBe(false);
    expect(isAllowedPublicShareUrl("quark", "https://pan.quark.cn/not-share/a")).toBe(false);
    expect(isAllowedPublicShareUrl("quark", "https://pan.quark.cn/s/")).toBe(false);
    expect(isAllowedPublicShareUrl("quark", `https://pan.quark.cn/s/${"a".repeat(2048)}`)).toBe(false);
  });

  it("requires status dates and rejects contradictory unchecked records", () => {
    expect(
      codes({
        ...validManifest(),
        records: [{ ...validRecord, accessStatus: "verified", checkedOn: null }],
      }),
    ).toContain("STATUS_REQUIRES_CHECKED_ON");

    expect(
      codes({
        ...validManifest(),
        records: [{ ...validRecord, accessStatus: "unchecked", checkedOn: "2026-10-17" }],
      }),
    ).toContain("STATUS_FORBIDS_CHECKED_ON");
  });

  it.each([
    ["unchecked", null],
    ["verified", "2026-10-17"],
    ["degraded", "2026-10-17"],
    ["expired", "2026-10-17"],
    ["withdrawn", "2026-10-17"],
  ] as const)("accepts the status/date pair %s", (accessStatus, checkedOn) => {
    expect(
      validatePublicManifest({
        ...validManifest(),
        records: [{ ...validRecord, accessStatus, checkedOn }],
      }).ok,
    ).toBe(true);
  });

  it("rejects every missing required field and invalid enum value", () => {
    const required = [
      "id",
      "title",
      "categoryId",
      "provider",
      "shareUrl",
      "accessStatus",
      "publishedAt",
    ] as const;
    for (const field of required) {
      const record: Record<string, unknown> = { ...validRecord };
      delete record[field];
      expect(codes({ ...validManifest(), records: [record] })).not.toEqual([]);
    }
    expect(codes({ ...validManifest(), schemaVersion: 2 })).toContain("INVALID_SCHEMA_VERSION");
    expect(codes({ ...validManifest(), records: {} })).toContain("INVALID_RECORDS");
    expect(codes({ ...validManifest(), records: [{ ...validRecord, provider: "other" }] })).toContain("INVALID_PROVIDER");
    expect(codes({ ...validManifest(), records: [{ ...validRecord, accessStatus: "active" }] })).toContain("INVALID_ACCESS_STATUS");
  });

  it("rejects non-object records and invalid checked dates", () => {
    expect(codes({ ...validManifest(), records: [null] })).toContain("INVALID_RECORD");
    expect(codes({ ...validManifest(), records: [{ ...validRecord, checkedOn: "2026-02-30" }] })).toContain("INVALID_CHECKED_ON");
    expect(codes({ ...validManifest(), records: [{ ...validRecord, accessStatus: "verified", checkedOn: "2026-02-30" }] })).toContain("STATUS_REQUIRES_CHECKED_ON");
  });

  it("rejects malformed dates, sizes, passcodes and public-field leaks", () => {
    expect(
      codes({
        ...validManifest(),
        generatedAt: "2026-10-17",
        records: [
          {
            ...validRecord,
            title: "包含 token= 的标题",
            publishedAt: "not-a-date",
            passcode: 1234,
            sizeBytes: -1,
          },
        ],
      }),
    ).toEqual(
      expect.arrayContaining([
        "INVALID_GENERATED_AT",
        "PUBLIC_FIELD_LEAK",
        "INVALID_PUBLISHED_AT",
        "INVALID_PASSCODE",
        "INVALID_SIZE_BYTES",
      ]),
    );

    expect(
      codes({
        ...validManifest(),
        records: [{ ...validRecord, description: "private/browse/raw.jsonl" }],
      }),
    ).toContain("PUBLIC_FIELD_LEAK");
  });

  it("rejects all non-safe size values", () => {
    for (const sizeBytes of [-1, 1.5, "1024", NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
      expect(codes({ ...validManifest(), records: [{ ...validRecord, sizeBytes }] })).toContain("INVALID_SIZE_BYTES");
    }
  });

  it("validates the checked-in manifest and approved record without exposing private values", async () => {
    const file = resolve(process.cwd(), "public/data/manifest.v1.json");
    let value: unknown;
    try {
      value = JSON.parse(readFileSync(file, "utf8")) as unknown;
    } catch {
      throw new Error("正式公开清单读取或 JSON 校验失败；原始内容不记录。");
    }
    expect(validatePublicManifest(value).ok).toBe(true);
    const parsed = parsePublicManifest(value);
    expect(parsed.schemaVersion).toBe(1);
    // Assert only booleans, counts, IDs and approved public-field projections.
    // Passing a full checked-in record to expect() could reveal its share entry on failure.
    expect(Object.keys(parsed).every((key) =>
      (PUBLIC_MANIFEST_FIELDS as readonly string[]).includes(key),
    )).toBe(true);
    expect(parsed.records.every((record) => Object.keys(record).every((key) =>
      (PUBLIC_MANIFEST_RECORD_FIELDS as readonly string[]).includes(key),
    ))).toBe(true);
    const ids = parsed.records.map((record) => record.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(parsed.records.every((record) =>
      getEnabledCategoryPath(record.categoryId).length > 0,
    )).toBe(true);
    const approvedRecords = parsed.records.filter((record) =>
      record.id === "university-series-001",
    );
    expect(approvedRecords.length).toBe(1);
    const approved = approvedRecords[0];
    expect({
      id: approved?.id,
      title: approved?.title,
      categoryId: approved?.categoryId,
      provider: approved?.provider,
      accessStatus: approved?.accessStatus,
      hasValidPublishedAt: typeof approved?.publishedAt === "string" &&
        Number.isFinite(Date.parse(approved.publishedAt)),
      hasValidCheckedOn: typeof approved?.checkedOn === "string" &&
        Number.isFinite(Date.parse(approved.checkedOn)),
    }).toEqual({
      id: "university-series-001",
      title: "大学系列",
      categoryId: "stage-university",
      provider: "quark",
      accessStatus: "verified",
      hasValidPublishedAt: true,
      hasValidCheckedOn: true,
    });
    const loaded = await loadPublicManifest(async () => responseFor(value));
    expect(loaded.records.length).toBe(parsed.records.length);
    expect(loaded.records.map((record) => record.id)).toEqual(ids);
  });

  it("loads JSON only through the fail-closed validation entry", async () => {
    const fetcher = vi.fn(async () => responseFor({
      ...validManifest(),
      records: [],
    }));
    const loaded = await loadPublicManifest(fetcher);
    expect(loaded.records).toHaveLength(0);
    expect(fetcher).toHaveBeenCalledWith(PUBLIC_MANIFEST_URL, {
      cache: "no-store",
      credentials: "omit",
    });

    await expect(
      loadPublicManifest(async () => responseFor({ ...validManifest(), extra: "reject" })),
    ).rejects.toThrow("公开清单校验失败");
    await expect(
      loadPublicManifest(async () => responseFor({ ...validManifest(), records: [{ ...validRecord, provider: "bad" }] })),
    ).rejects.toThrow("公开清单校验失败");
    await expect(
      loadPublicManifest(async () => responseFor({ ...validManifest(), records: [{ ...validRecord, accessStatus: "expired", checkedOn: null }] })),
    ).resolves.toMatchObject({ schemaVersion: 1 });
  });
});
