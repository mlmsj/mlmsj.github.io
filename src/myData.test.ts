import { describe, expect, it } from "vitest";
import { MAX_RECENT_VIEWS, emptyMyData, mergeMyData, recordRecent, toggleTimed, validateMyData } from "./myData";

describe("my local data", () => {
  it("deduplicates favorites and toggles by stable id", () => {
    const added = toggleTimed([], "01", "2026-10-13T00:00:00.000Z");
    expect(added).toEqual([{ id: "01", at: "2026-10-13T00:00:00.000Z" }]);
    expect(toggleTimed(added, "01")).toEqual([]);
  });

  it("moves revisited resources to the front and keeps 50", () => {
    let items: { id: string; at: string }[] = [];
    for (let index = 0; index < MAX_RECENT_VIEWS + 2; index++) items = recordRecent(items, String(index), new Date(index * 1000).toISOString());
    expect(items).toHaveLength(50);
    expect(items[0].id).toBe("51");
    expect(recordRecent(items, "20", "2026-10-13T00:00:00.000Z")[0].id).toBe("20");
  });

  it("rejects unknown versions and invalid types", () => {
    expect(() => validateMyData({ ...emptyMyData(), version: 2 })).toThrow("版本");
    expect(() => validateMyData({ ...emptyMyData(), favorites: [{ id: "01", at: "bad" }] })).toThrow("无效记录");
  });

  it("merges conflicts by latest timestamp", () => {
    const current = { ...emptyMyData(), favorites: [{ id: "01", at: "2026-01-01T00:00:00.000Z" }] };
    const incoming = { ...emptyMyData(), favorites: [{ id: "01", at: "2026-10-13T00:00:00.000Z" }] };
    expect(mergeMyData(current, incoming).favorites).toEqual(incoming.favorites);
  });
});
