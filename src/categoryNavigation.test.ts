import { describe, expect, it } from "vitest";
import {
  HIDDEN_SKILL_GROWTH_ROOT_IDS,
  shouldShowCategoryInNavigation,
} from "./categoryNavigation";

describe("skill-growth navigation isolation", () => {
  it("keeps skill-growth roots out of the generic directory while preserving leaf visibility", () => {
    expect(HIDDEN_SKILL_GROWTH_ROOT_IDS.has("skill-ai-digital-tech")).toBe(true);
    expect(shouldShowCategoryInNavigation("skill-ai-digital-tech", 0)).toBe(false);
    expect(shouldShowCategoryInNavigation("skill-ai-deepseek", 0)).toBe(true);
  });
});
