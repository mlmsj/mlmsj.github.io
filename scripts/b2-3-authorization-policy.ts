import type {
  AuthorizationContext,
  AuthorizationEvidence,
} from "../src/catalogV2";
import { LEGACY_V1_COMPAT_DELIVERY_ID_PREFIX } from "../src/deliveryIdentity";
import type { PublicProjectionPolicy } from "../src/publicProjection";

/**
 * The owner authorization record explicitly covers the current university
 * public projection: seventeen curated university/certification aggregate entries. The replaced leaf
 * records remain in source history but are intentionally omitted from the
 * current public projection. The computer aggregate is a clean study-material
 * subset; installation, activation, and executable packages stay out of it.
 */
export const B2_3_APPROVED_RESOURCE_IDS = [
  "university-topic-math-001",
  "university-topic-professional-courses-001",
  "university-topic-textbooks-001",
  "university-topic-ideology-001",
  "university-topic-competition-001",
  "university-topic-cet-001",
  "university-topic-ielts-001",
  "university-topic-proof-001",
  "university-topic-computer-001",
  "university-topic-postgrad-001",
  "university-topic-career-001",
  "university-quark-career-ppt-001",
  "university-quark-resume-templates-001",
  "certification-topic-university-001",
  "certification-topic-foreign-language-001",
  "certification-topic-upgrade-001",
  "certification-topic-civil-service-001",
] as const;

const B2_3_CURRENT_AGGREGATE_RESOURCE_IDS = new Set<string>([
  ...B2_3_APPROVED_RESOURCE_IDS,
]);

export const B2_3_RESOURCE_TO_UFB = new Map<string, string>([
  ["university-quark-math-advanced-001", "UFB-001"],
  ["university-quark-linear-algebra-001", "UFB-002"],
  ["university-quark-probability-textbook-001", "UFB-003"],
  ["university-quark-probability-review-001", "UFB-004"],
  ["university-quark-mathematical-analysis-001", "UFB-005"],
  ["university-quark-calculus-001", "UFB-006"],
  ["university-quark-ideology-marxism-001", "UFB-007"],
  ["university-quark-cet4-001", "UFB-008"],
  ["university-quark-ielts-001", "UFB-009"],
  ["university-quark-postgrad-001", "UFB-011"],
  ["university-quark-career-ppt-001", "UFB-012"],
  ["university-quark-resume-templates-001", "UFB-013"],
  ["university-quark-biochemistry-001", "UFB-015"],
  ["university-quark-english-contest-001", "UFB-016"],
]);

export const JUNIOR_RELEASE_6_APPROVED_RESOURCE_IDS = [
  "jh-topic-textbooks-001",
  "jh-topic-workbooks-001",
  "jh-topic-exams-001",
  "jh-topic-courses-001",
  "jh-topic-subjects-001",
  "jh-topic-sprint-001",
] as const;

export const JUNIOR_RELEASE_6_DELIVERY_IDS = new Map<string, string>([
  ["jh-topic-textbooks-001", "dlv-jh-topic-textbooks-quark-01"],
  ["jh-topic-workbooks-001", "dlv-jh-topic-workbooks-quark-01"],
  ["jh-topic-exams-001", "dlv-jh-topic-exams-quark-01"],
  ["jh-topic-courses-001", "dlv-jh-topic-courses-quark-01"],
  ["jh-topic-subjects-001", "dlv-jh-topic-subjects-quark-01"],
  ["jh-topic-sprint-001", "dlv-jh-topic-sprint-quark-01"],
]);

export const HS_THEME_5_APPROVED_RESOURCE_IDS = [
  "hs-topic-textbooks-001",
  "hs-topic-workbooks-001",
  "hs-topic-courses-001",
  "hs-topic-mock-001",
  "hs-topic-sprint-001",
  "hs-topic-subjects-001",
  "hs-topic-one-series-001",
  "hs-topic-competition-001",
  "hs-topic-volunteer-001",
  "hs-topic-policies-001",
] as const;

export const HS_THEME_6_DELIVERY_IDS = new Map<string, string>([
  ["hs-topic-textbooks-001", "dlv-hs-topic-textbooks-quark-01"],
  ["hs-topic-workbooks-001", "dlv-hs-topic-workbooks-quark-01"],
  ["hs-topic-courses-001", "dlv-hs-topic-courses-quark-01"],
  ["hs-topic-mock-001", "dlv-hs-topic-mock-quark-01"],
  ["hs-topic-sprint-001", "dlv-hs-topic-sprint-quark-01"],
  ["hs-topic-subjects-001", "dlv-hs-topic-subjects-quark-01"],
  ["hs-topic-one-series-001", "dlv-hs-topic-one-series-quark-01"],
  ["hs-topic-competition-001", "dlv-hs-topic-competition-quark-01"],
  ["hs-topic-volunteer-001", "dlv-hs-topic-volunteer-quark-01"],
  ["hs-topic-policies-001", "dlv-hs-topic-policies-quark-01"],
]);

export const SKILL_GROWTH_AI_APPROVED_RESOURCE_IDS = [
  "ai-learning-cognition-001",
  "ai-chatgpt-001",
  "ai-chatgpt-002",
  "ai-deepseek-001",
  "ai-deepseek-002",
] as const;

export const SKILL_GROWTH_AI_DELIVERY_IDS = new Map<string, string>([
  ["ai-learning-cognition-001", "dlv-ai-learning-cognition-quark-01"],
  ["ai-chatgpt-001", "dlv-ai-chatgpt-001-quark-01"],
  ["ai-chatgpt-002", "dlv-ai-chatgpt-002-quark-01"],
  ["ai-deepseek-001", "dlv-ai-deepseek-001-quark-01"],
  ["ai-deepseek-002", "dlv-ai-deepseek-002-quark-01"],
]);

export const SKILL_GROWTH_NON_AI_APPROVED_RESOURCE_IDS = [
  "skill-coding-scratch-001",
  "skill-coding-python-001",
  "skill-coding-cpp-001",
  "skill-coding-robotics-001",
  "skill-coding-extension-001",
  "skill-ps-video-001",
  "skill-ps-online-001",
  "skill-jianying-001",
  "skill-premiere-001",
  "skill-video-assets-001",
  "skill-music-sfx-001",
  "skill-social-short-video-001",
  "skill-social-wechat-001",
  "skill-social-xiaohongshu-001",
  "skill-driving-subject-1-001",
  "skill-driving-subject-2-001",
  "skill-driving-subject-3-001",
  "skill-driving-subject-4-001",
  "skill-driving-question-bank-001",
  "skill-calligraphy-online-001",
  "skill-calligraphy-rubbings-001",
  "skill-travel-ticketing-001",
  "skill-clip-tutorial-01",
  "skill-clip-tutorial-02",
  "skill-clip-tutorial-05",
  "skill-clip-tutorial-08",
  "skill-clip-tutorial-09",
  "skill-clip-tutorial-10",
  "skill-clip-tutorial-11",
  "skill-clip-tutorial-13",
  "skill-clip-tutorial-15",
  "skill-clip-tutorial-21",
  "skill-clip-tutorial-22",
  "skill-clip-tutorial-25",
  "skill-clip-tutorial-26",
  "skill-clip-tutorial-31",
] as const;

export const SKILL_GROWTH_NON_AI_DELIVERY_IDS = new Map<string, string>([
  ["skill-coding-scratch-001", "dlv-skill-coding-scratch-001-quark-01"],
  ["skill-coding-python-001", "dlv-skill-coding-python-001-quark-01"],
  ["skill-coding-cpp-001", "dlv-skill-coding-cpp-001-quark-01"],
  ["skill-coding-robotics-001", "dlv-skill-coding-robotics-001-quark-01"],
  ["skill-coding-extension-001", "dlv-skill-coding-extension-001-quark-01"],
  ["skill-ps-video-001", "dlv-skill-ps-video-001-quark-01"],
  ["skill-ps-online-001", "dlv-skill-ps-online-001-quark-01"],
  ["skill-jianying-001", "dlv-skill-jianying-001-quark-01"],
  ["skill-premiere-001", "dlv-skill-premiere-001-quark-01"],
  ["skill-video-assets-001", "dlv-skill-video-assets-001-quark-01"],
  ["skill-music-sfx-001", "dlv-skill-music-sfx-001-quark-01"],
  ["skill-social-short-video-001", "dlv-skill-social-short-video-001-quark-01"],
  ["skill-social-wechat-001", "dlv-skill-social-wechat-001-quark-01"],
  ["skill-social-xiaohongshu-001", "dlv-skill-social-xiaohongshu-001-quark-01"],
  ["skill-driving-subject-1-001", "dlv-skill-driving-subject-1-001-quark-01"],
  ["skill-driving-subject-2-001", "dlv-skill-driving-subject-2-001-quark-01"],
  ["skill-driving-subject-3-001", "dlv-skill-driving-subject-3-001-quark-01"],
  ["skill-driving-subject-4-001", "dlv-skill-driving-subject-4-001-quark-01"],
  ["skill-driving-question-bank-001", "dlv-skill-driving-question-bank-001-quark-01"],
  ["skill-calligraphy-online-001", "dlv-skill-calligraphy-online-001-quark-01"],
  ["skill-calligraphy-rubbings-001", "dlv-skill-calligraphy-rubbings-001-quark-01"],
  ["skill-travel-ticketing-001", "dlv-skill-travel-ticketing-001-quark-01"],
  ["skill-clip-tutorial-01", "dlv-skill-clip-tutorial-01-quark-01"],
  ["skill-clip-tutorial-02", "dlv-skill-clip-tutorial-02-quark-01"],
  ["skill-clip-tutorial-05", "dlv-skill-clip-tutorial-05-quark-01"],
  ["skill-clip-tutorial-08", "dlv-skill-clip-tutorial-08-quark-01"],
  ["skill-clip-tutorial-09", "dlv-skill-clip-tutorial-09-quark-01"],
  ["skill-clip-tutorial-10", "dlv-skill-clip-tutorial-10-quark-01"],
  ["skill-clip-tutorial-11", "dlv-skill-clip-tutorial-11-quark-01"],
  ["skill-clip-tutorial-13", "dlv-skill-clip-tutorial-13-quark-01"],
  ["skill-clip-tutorial-15", "dlv-skill-clip-tutorial-15-quark-01"],
  ["skill-clip-tutorial-21", "dlv-skill-clip-tutorial-21-quark-01"],
  ["skill-clip-tutorial-22", "dlv-skill-clip-tutorial-22-quark-01"],
  ["skill-clip-tutorial-25", "dlv-skill-clip-tutorial-25-quark-01"],
  ["skill-clip-tutorial-26", "dlv-skill-clip-tutorial-26-quark-01"],
  ["skill-clip-tutorial-31", "dlv-skill-clip-tutorial-31-quark-01"],
]);

export const B2_3_CONTEXT: AuthorizationContext = {
  audience: "public",
  platform: "website",
  now: "2026-11-07T09:12:00+08:00",
};

/**
 * v1 has one current delivery row per Resource but no persisted deliveryId.
 * This deterministic compatibility identity is local to the candidate and
 * is not the URL, FID, share code, or a claim about the original provider ID.
 */
export const deliveryIdFor = (resourceId: string) =>
  `${LEGACY_V1_COMPAT_DELIVERY_ID_PREFIX}${resourceId}`;

const evidenceFor = (resourceId: string): readonly AuthorizationEvidence[] => {
  const deliveryId = deliveryIdFor(resourceId);
  const isAggregateEntry = B2_3_CURRENT_AGGREGATE_RESOURCE_IDS.has(resourceId);
  return [
    {
      evidenceId: `${isAggregateEntry ? "owner-auth-20261106" : "owner-auth-20261101"}:${resourceId}:resource`,
      subjectType: "resource",
      resourceId,
      actionScope: ["display_metadata", "expose_share_link"],
      audienceScope: ["public"],
      platformScope: ["website"],
      status: "approved",
      evidenceRef: isAggregateEntry
        ? "ZWG-CATEGORY-CERTIFICATION-HIGHSCHOOL-20261107-REPORT.md#核验结果"
        : "docs/OWNER-AUTHORIZATION-20261101.md#适用范围",
      reviewedAt: isAggregateEntry
        ? "2026-11-07T08:30:57+08:00"
        : "2026-11-01T00:00:00+08:00",
    },
    {
      evidenceId: `${isAggregateEntry ? "owner-auth-20261106" : "owner-auth-20261101"}:${resourceId}:delivery`,
      subjectType: "delivery",
      resourceId,
      deliveryId,
      actionScope: ["expose_share_link"],
      audienceScope: ["public"],
      platformScope: ["website"],
      status: "approved",
      evidenceRef: isAggregateEntry
        ? "ZWG-CATEGORY-CERTIFICATION-HIGHSCHOOL-20261107-REPORT.md#核验结果"
        : "docs/UNIVERSITY-FIRST-BATCH-AUTHORIZATION.md#当前候选状态",
      reviewedAt: isAggregateEntry
        ? "2026-11-07T08:30:57+08:00"
        : "2026-11-01T00:00:00+08:00",
    },
  ];
};

export const B2_3_POLICIES = new Map<string, PublicProjectionPolicy>(
  [
    ...B2_3_APPROVED_RESOURCE_IDS.map((resourceId) => [
      resourceId,
      {
        deliveryId: deliveryIdFor(resourceId),
        browseState: "observed",
        evidence: evidenceFor(resourceId),
      },
    ] as const),
    ...JUNIOR_RELEASE_6_APPROVED_RESOURCE_IDS.map((resourceId) => {
      const deliveryId = JUNIOR_RELEASE_6_DELIVERY_IDS.get(resourceId);
      if (!deliveryId) throw new Error(`Missing junior Delivery ID: ${resourceId}`);
      return [
        resourceId,
        {
          deliveryId,
          browseState: "observed",
          evidence: [
            {
              evidenceId: `auth-${resourceId}-resource-01`,
              subjectType: "resource",
              resourceId,
              actionScope: ["display_metadata", "expose_share_link"],
              audienceScope: ["public"],
              platformScope: ["website"],
              status: "approved",
              evidenceRef: `ZWG-CATEGORY-CERTIFICATION-HIGHSCHOOL-20261107-REPORT.md#核验结果`,
              reviewedAt: "2026-11-07T09:12:00+08:00",
            },
            {
              evidenceId: `auth-${resourceId}-delivery-01`,
              subjectType: "delivery",
              resourceId,
              deliveryId,
              actionScope: ["expose_share_link"],
              audienceScope: ["public"],
              platformScope: ["website"],
              status: "approved",
              evidenceRef: `ZWG-CATEGORY-CERTIFICATION-HIGHSCHOOL-20261107-REPORT.md#核验结果`,
              reviewedAt: "2026-11-07T09:12:00+08:00",
            },
          ],
        },
      ] as const;
    }),
    ...HS_THEME_5_APPROVED_RESOURCE_IDS.map((resourceId) => {
      const deliveryId = HS_THEME_6_DELIVERY_IDS.get(resourceId);
      if (!deliveryId) throw new Error(`Missing high-school theme Delivery ID: ${resourceId}`);
      return [
        resourceId,
        {
          deliveryId,
          browseState: "observed",
          evidence: [
            {
              evidenceId: `auth-${resourceId}-resource-01`,
              subjectType: "resource",
              resourceId,
              actionScope: ["display_metadata", "expose_share_link"],
              audienceScope: ["public"],
              platformScope: ["website"],
              status: "approved",
                evidenceRef: `ZWG-CATEGORY-CERTIFICATION-HIGHSCHOOL-20261107-REPORT.md#核验结果`,
                reviewedAt: "2026-11-07T09:12:00+08:00",
            },
            {
              evidenceId: `auth-${resourceId}-delivery-01`,
              subjectType: "delivery",
              resourceId,
              deliveryId,
              actionScope: ["expose_share_link"],
              audienceScope: ["public"],
              platformScope: ["website"],
              status: "approved",
                evidenceRef: `ZWG-CATEGORY-CERTIFICATION-HIGHSCHOOL-20261107-REPORT.md#核验结果`,
                reviewedAt: "2026-11-07T09:12:00+08:00",
            },
          ],
        },
      ] as const;
    }),
    ...SKILL_GROWTH_AI_APPROVED_RESOURCE_IDS.map((resourceId) => {
      const deliveryId = SKILL_GROWTH_AI_DELIVERY_IDS.get(resourceId);
      if (!deliveryId) throw new Error(`Missing skill-growth AI Delivery ID: ${resourceId}`);
      return [
        resourceId,
        {
          deliveryId,
          browseState: "observed",
          evidence: [
            {
              evidenceId: `auth-${resourceId}-resource-01`,
              subjectType: "resource",
              resourceId,
              actionScope: ["display_metadata", "expose_share_link"],
              audienceScope: ["public"],
              platformScope: ["website"],
              status: "approved",
              evidenceRef: "docs/ZWG-SKILL-GROWTH-AI-PUBLIC-RELEASE-20261109.md#站长授权与公开接入确认",
              reviewedAt: "2026-11-09",
            },
            {
              evidenceId: `auth-${resourceId}-delivery-01`,
              subjectType: "delivery",
              resourceId,
              deliveryId,
              actionScope: ["expose_share_link"],
              audienceScope: ["public"],
              platformScope: ["website"],
              status: "approved",
              evidenceRef: "docs/ZWG-SKILL-GROWTH-AI-PUBLIC-RELEASE-20261109.md#站长授权与公开接入确认",
              reviewedAt: "2026-11-09",
            },
          ],
        },
      ] as const;
    }),
    ...SKILL_GROWTH_NON_AI_APPROVED_RESOURCE_IDS.map((resourceId) => {
      const deliveryId = SKILL_GROWTH_NON_AI_DELIVERY_IDS.get(resourceId);
      if (!deliveryId) throw new Error(`Missing skill-growth non-AI Delivery ID: ${resourceId}`);
      return [
        resourceId,
        {
          deliveryId,
          browseState: "observed",
          evidence: [
            {
              evidenceId: `auth-${resourceId}-resource-01`,
              subjectType: "resource",
              resourceId,
              actionScope: ["display_metadata", "expose_share_link"],
              audienceScope: ["public"],
              platformScope: ["website"],
              status: "approved",
              evidenceRef: "docs/ZWG-SKILL-GROWTH-NON-AI-PUBLIC-RELEASE-20261110.md#站长授权与公开接入确认",
              reviewedAt: "2026-11-10",
            },
            {
              evidenceId: `auth-${resourceId}-delivery-01`,
              subjectType: "delivery",
              resourceId,
              deliveryId,
              actionScope: ["expose_share_link"],
              audienceScope: ["public"],
              platformScope: ["website"],
              status: "approved",
              evidenceRef: "docs/ZWG-SKILL-GROWTH-NON-AI-PUBLIC-RELEASE-20261110.md#站长授权与公开接入确认",
              reviewedAt: "2026-11-10",
            },
          ],
        },
      ] as const;
    }),
  ],
);

export const B2_3_HOLD_REASONS = new Map<string, string>([
  [
    "university-series-001",
    "历史聚合入口；授权文档未以该 Resource ID 建立 Resource/Delivery 精确证据",
  ],
  [
    "university-topic-review-001",
    "历史聚合入口；授权文档未以该 Resource ID 建立 Resource/Delivery 精确证据",
  ],
  [
    "university-quark-english-contest-001",
    "UFB-016 权利授权已记录，但 strict-v2 来源范围仍为 HOLD_OWNER_SCOPE",
  ],
]);
