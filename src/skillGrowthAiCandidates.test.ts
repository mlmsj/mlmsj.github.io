import { describe, expect, it } from "vitest";
import { getCategoryPath, categories } from "./categories";
import { skillGrowthAiCandidates } from "./skillGrowthAiCandidates";

describe("skill-growth AI candidate register", () => {
  it("registers the five bounded AI folders as private candidates", () => {
    expect(skillGrowthAiCandidates).toHaveLength(5);
    expect(
      skillGrowthAiCandidates.every(
        (candidate) => candidate.registrationStatus === "PRIVATE_CANDIDATE_SHARE_CREATED",
      ),
    ).toBe(true);
  });

  it("maps every AI candidate to one stable leaf category", () => {
    const categoryIds = new Set(categories.map((category) => category.id));
    const candidateIds = new Set(skillGrowthAiCandidates.map((candidate) => candidate.candidateId));

    expect(candidateIds.size).toBe(skillGrowthAiCandidates.length);
    for (const candidate of skillGrowthAiCandidates) {
      expect(categoryIds.has(candidate.proposedCategoryId)).toBe(true);
      expect(getCategoryPath(candidate.proposedCategoryId).at(-1)?.level).toBe(3);
    }
  });

  it("keeps the audited folder-to-category mapping and observed counts", () => {
    expect(
      skillGrowthAiCandidates.map((candidate) => [
        candidate.title,
        candidate.proposedCategoryId,
        candidate.quarkObservedItemCount,
      ]),
    ).toEqual([
      ["AI时代学习、思考与创作", "skill-ai-learning-cognition", 37],
      ["chatGPT（1）", "skill-ai-chatgpt", 9],
      ["chatGPT（2）", "skill-ai-chatgpt", 12],
      ["DeepSeek（1）", "skill-ai-deepseek", 7],
      ["DeepSeek（2）", "skill-ai-deepseek", 2],
    ]);
  });
});
