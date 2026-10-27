import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import { createImageArchive, uniqueArchiveNames } from "./imageArchive";

describe("image archive completeness", () => {
  it.each([
    [["same.jpg", "same.jpg"], ["same.jpg", "same (2).jpg"]],
    [["same.jpg", "same.jpg", "same (2).jpg"], ["same.jpg", "same (3).jpg", "same (2).jpg"]],
    [["A.PNG", "a.png"], ["A.PNG", "a (2).png"]],
    [["note", "note", "note"], ["note", "note (2)", "note (3)"]],
    [[".image", ".image"], [".image", ".image (2)"]],
    [["a.jpg", "b.png"], ["a.jpg", "b.png"]],
  ])("assigns stable unique names for %j", (names, expected) => {
    expect(uniqueArchiveNames(names)).toEqual(expected);
  });
  it("reopens a ZIP retaining every duplicate-name payload without mutating results", async () => {
    const entries = [{ name: "same.jpg", data: new Uint8Array([1, 2, 3]) }, { name: "same.jpg", data: new Uint8Array([4, 5]) }];
    const archive = createImageArchive(entries);
    const reopened = await JSZip.loadAsync(await archive.generateAsync({ type: "uint8array" }));
    expect(Object.keys(reopened.files)).toEqual(["same.jpg", "same (2).jpg"]);
    expect(await reopened.file("same.jpg")!.async("uint8array")).toEqual(entries[0].data);
    expect(await reopened.file("same (2).jpg")!.async("uint8array")).toEqual(entries[1].data);
    expect(entries.map(entry => entry.name)).toEqual(["same.jpg", "same.jpg"]);
  });
});
