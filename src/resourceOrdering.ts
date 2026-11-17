import type { Category } from "./categories";
import type { Resource } from "./resources";

export const NUMERIC_WORKBOOK_CATEGORY_IDS = new Set([
  "type-senior-workbooks-first-round-2027",
  "type-senior-workbooks-synchronous-2027",
  "purpose-certification-cet",
  "purpose-certification-ielts",
  "purpose-certification-computer",
  "purpose-certification-university",
  "purpose-certification-civil-service",
  "purpose-certification-foreign-language",
  "purpose-certification-upgrade",
]);

export const AGGREGATE_RESOURCE_IDS = new Set([
  "jh-topic-courses-001",
  "jh-courses-by-org-001",
  "jh-courses-by-grade-001",
  "hs-topic-one-series-001",
  "hs-topic-subjects-001",
  "hs-one-series-yishu-001",
  "hs-one-series-yisheng-001",
  "hs-one-series-yiying-001",
  "hs-one-series-yidi-001",
  "hs-one-series-yihua-001",
  "hs-one-series-yizheng-001",
  "hs-one-series-yiwu-001",
  "hs-one-series-last-ten-lessons-001",
  "hs-one-series-free-gaokao-001",
  "hs-one-series-huang-furen-001",
  "hs-one-series-shiyou-yuwen-001",
  "hs-subjects-chinese-001",
  "hs-subjects-physics-001",
  "hs-subjects-chemistry-001",
  "hs-subjects-math-001",
  "hs-subjects-geography-001",
  "hs-subjects-english-001",
  "hs-subjects-history-001",
  "hs-subjects-biology-001",
  "hs-subjects-politics-001",
  "university-topic-major-001",
  "university-topic-postgraduate-001",
  "university-topic-postgrad-001",
  "certification-topic-civil-service-001",
  "certification-topic-foreign-language-001",
  "certification-topic-upgrade-001",
  "hs-workbooks-first-round-2027-001",
  "hs-workbooks-synchronous-2027-001",
  "university-topic-cet-001",
  "university-topic-ielts-001",
  "university-topic-computer-001",
  "certification-topic-university-001",
]);

export const getAggregateResourceRank = (resource: Resource) =>
  AGGREGATE_RESOURCE_IDS.has(resource.id) ? 0 : 1;

export const getLeadingSequenceNumber = (title: string) => {
  const match = /^(\d+)\./.exec(title.trim());
  return match ? Number(match[1]) : Number.POSITIVE_INFINITY;
};

export const compareCategoryPaths = (
  left: readonly Category[],
  right: readonly Category[],
) => {
  if (left.length === 0 || right.length === 0) {
    return right.length - left.length;
  }

  const sharedLength = Math.min(left.length, right.length);
  for (let index = 0; index < sharedLength; index += 1) {
    const leftCategory = left[index];
    const rightCategory = right[index];
    if (leftCategory.id === rightCategory.id) continue;

    return (
      leftCategory.sortOrder - rightCategory.sortOrder ||
      leftCategory.name.localeCompare(rightCategory.name, "zh-CN") ||
      leftCategory.id.localeCompare(rightCategory.id)
    );
  }

  return left.length - right.length;
};
