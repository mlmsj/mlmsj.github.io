import type {
  AuthorizationContext,
  AuthorizationEvidence,
} from "../src/catalogV2";
import { LEGACY_V1_COMPAT_DELIVERY_ID_PREFIX } from "../src/deliveryIdentity";
import type { PublicProjectionPolicy } from "../src/publicProjection";

/**
 * The owner authorization record explicitly covers these 13 independent
 * university candidates. UFB-016 is intentionally absent: its rights
 * authorization is recorded, but its inclusion in the strict-v2 source scope
 * remains on hold. The five high-school candidates are registered separately
 * below with their exact Delivery identities from the private release gate.
 */
export const B2_3_APPROVED_RESOURCE_IDS = [
  "university-quark-math-advanced-001",
  "university-quark-linear-algebra-001",
  "university-quark-probability-textbook-001",
  "university-quark-probability-review-001",
  "university-quark-mathematical-analysis-001",
  "university-quark-calculus-001",
  "university-quark-ideology-marxism-001",
  "university-quark-cet4-001",
  "university-quark-ielts-001",
  "university-quark-postgrad-001",
  "university-quark-career-ppt-001",
  "university-quark-resume-templates-001",
  "university-quark-biochemistry-001",
] as const;

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

export const HS_FIRST_BATCH_5_APPROVED_RESOURCE_IDS = [
  "hs-gaokao-2024-new-standard-1-001",
  "hs-gaokao-2024-new-standard-2-002",
  "hs-gaokao-2024-national-jia-003",
  "hs-gaokao-2025-national-1-004",
  "hs-gaokao-2025-national-2-005",
] as const;

export const HS_FIRST_BATCH_5_DELIVERY_IDS = new Map<string, string>([
  [
    "hs-gaokao-2024-new-standard-1-001",
    "dlv-hs-gaokao-2024-new-standard-1-001-quark-01",
  ],
  [
    "hs-gaokao-2024-new-standard-2-002",
    "dlv-hs-gaokao-2024-new-standard-2-002-quark-01",
  ],
  [
    "hs-gaokao-2024-national-jia-003",
    "dlv-hs-gaokao-2024-national-jia-003-quark-01",
  ],
  [
    "hs-gaokao-2025-national-1-004",
    "dlv-hs-gaokao-2025-national-1-004-quark-01",
  ],
  [
    "hs-gaokao-2025-national-2-005",
    "dlv-hs-gaokao-2025-national-2-005-quark-01",
  ],
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

export const B2_3_CONTEXT: AuthorizationContext = {
  audience: "public",
  platform: "website",
  now: "2026-11-02T00:00:00+08:00",
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
  return [
    {
      evidenceId: `owner-auth-20261101:${resourceId}:resource`,
      subjectType: "resource",
      resourceId,
      actionScope: ["display_metadata", "expose_share_link"],
      audienceScope: ["public"],
      platformScope: ["website"],
      status: "approved",
      evidenceRef: "docs/OWNER-AUTHORIZATION-20261101.md#适用范围",
      reviewedAt: "2026-11-01T00:00:00+08:00",
    },
    {
      evidenceId: `owner-auth-20261101:${resourceId}:delivery`,
      subjectType: "delivery",
      resourceId,
      deliveryId,
      actionScope: ["expose_share_link"],
      audienceScope: ["public"],
      platformScope: ["website"],
      status: "approved",
      evidenceRef: "docs/UNIVERSITY-FIRST-BATCH-AUTHORIZATION.md#当前候选状态",
      reviewedAt: "2026-11-01T00:00:00+08:00",
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
    ...HS_FIRST_BATCH_5_APPROVED_RESOURCE_IDS.map((resourceId) => {
      const deliveryId = HS_FIRST_BATCH_5_DELIVERY_IDS.get(resourceId);
      if (!deliveryId) throw new Error(`Missing high-school Delivery ID: ${resourceId}`);
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
              evidenceRef: "HS-FIRST-BATCH-5-SHARE-E2E-2",
              reviewedAt: "2026-11-03T15:53:50+08:00",
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
              evidenceRef: "HS-FIRST-BATCH-5-SHARE-E2E-2",
              reviewedAt: "2026-11-03T15:53:50+08:00",
            },
          ],
        },
      ] as const;
    }),
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
              evidenceRef: `RESOURCE-BATCH-04-PROJECT-OWNER-APPROVAL-20261104#${resourceId}`,
              reviewedAt: "2026-11-04T11:16:33+08:00",
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
              evidenceRef: `RESOURCE-BATCH-04-PROJECT-OWNER-APPROVAL-20261104#${resourceId}`,
              reviewedAt: "2026-11-04T11:16:33+08:00",
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
    "university-topic-math-001",
    "历史聚合入口；授权文档未以该 Resource ID 建立 Resource/Delivery 精确证据",
  ],
  [
    "university-topic-professional-courses-001",
    "历史聚合入口；授权文档未以该 Resource ID 建立 Resource/Delivery 精确证据",
  ],
  [
    "university-topic-textbooks-001",
    "历史聚合入口；授权文档未以该 Resource ID 建立 Resource/Delivery 精确证据",
  ],
  [
    "university-topic-review-001",
    "历史聚合入口；授权文档未以该 Resource ID 建立 Resource/Delivery 精确证据",
  ],
  [
    "university-topic-ideology-001",
    "历史聚合入口；授权文档未以该 Resource ID 建立 Resource/Delivery 精确证据",
  ],
  [
    "university-topic-cet-001",
    "历史聚合入口；授权文档未以该 Resource ID 建立 Resource/Delivery 精确证据",
  ],
  [
    "university-topic-ielts-001",
    "历史聚合入口；授权文档未以该 Resource ID 建立 Resource/Delivery 精确证据",
  ],
  [
    "university-topic-computer-001",
    "UFB-010 仅明确排除独立单项；该聚合 Resource 本身没有匹配的授权证据",
  ],
  [
    "university-topic-postgrad-001",
    "历史聚合入口；授权文档未以该 Resource ID 建立 Resource/Delivery 精确证据",
  ],
  [
    "university-topic-career-001",
    "历史聚合入口；授权文档未以该 Resource ID 建立 Resource/Delivery 精确证据",
  ],
  [
    "university-topic-competition-001",
    "历史聚合入口；授权文档未以该 Resource ID 建立 Resource/Delivery 精确证据",
  ],
  [
    "university-quark-english-contest-001",
    "UFB-016 权利授权已记录，但 strict-v2 来源范围仍为 HOLD_OWNER_SCOPE",
  ],
]);
