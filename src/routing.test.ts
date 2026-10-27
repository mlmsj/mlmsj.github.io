import { describe, expect, it } from "vitest";
import {
  appPathFromLocationForBase,
  locationPathForAppPathForBase,
  normalizeBasePath,
} from "./routing";

const pagesBase = "/zhaowenguan-v2/";

describe("GitHub Pages subpath routing", () => {
  it("normalizes the configured base and strips it only at a path boundary", () => {
    expect(normalizeBasePath(pagesBase)).toBe("/zhaowenguan-v2");
    expect(appPathFromLocationForBase("/zhaowenguan-v2/", pagesBase)).toBe("/");
    expect(appPathFromLocationForBase("/zhaowenguan-v2/resources/", pagesBase)).toBe(
      "/resources",
    );
    expect(appPathFromLocationForBase("/zhaowenguan-v2x/resources", pagesBase)).toBe(
      "/zhaowenguan-v2x/resources",
    );
  });

  it("adds the base exactly once when navigating with query and hash", () => {
    expect(
      locationPathForAppPathForBase(
        "/resources?q=线代#results",
        pagesBase,
        "https://example.invalid",
      ),
    ).toBe("/zhaowenguan-v2/resources?q=%E7%BA%BF%E4%BB%A3#results");

    expect(
      locationPathForAppPathForBase(
        "/zhaowenguan-v2/detail?id=university-series-001",
        pagesBase,
        "https://example.invalid",
      ),
    ).toBe("/zhaowenguan-v2/detail?id=university-series-001");
  });

  it("round-trips the required direct routes without losing query parameters", () => {
    const locations = [
      "/",
      "/resources",
      "/categories",
      "/tools/ocr",
      "/detail?id=example-resource",
    ];

    for (const location of locations) {
      const publishedLocation = locationPathForAppPathForBase(
        location,
        pagesBase,
        "https://example.invalid",
      );
      const url = new URL(publishedLocation, "https://example.invalid");
      expect(appPathFromLocationForBase(url.pathname, pagesBase) + url.search).toBe(
        location,
      );
    }
  });
});
