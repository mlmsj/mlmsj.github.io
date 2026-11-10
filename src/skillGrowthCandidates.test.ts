import { describe, expect, it } from "vitest";
import {
  needsReviewSkillGrowthCandidates,
  readySkillGrowthCandidates,
  skillGrowthCandidates,
} from "./skillGrowthCandidates";
import { categories, getCategoryPath } from "./categories";

describe("skill-growth candidate register", () => {
  it("keeps the audited 31-package split at 14 ready and 17 review items", () => {
    expect(skillGrowthCandidates).toHaveLength(31);
    expect(readySkillGrowthCandidates).toHaveLength(14);
    expect(needsReviewSkillGrowthCandidates).toHaveLength(17);
  });

  it("uses only stable category IDs for proposed single-category mappings", () => {
    const ids = new Set(categories.map((category) => category.id));
    for (const candidate of skillGrowthCandidates) {
      if (candidate.proposedCategoryId) {
        expect(ids.has(candidate.proposedCategoryId)).toBe(true);
        expect(getCategoryPath(candidate.proposedCategoryId).at(-1)?.level).toBe(3);
      }
    }
  });
});
