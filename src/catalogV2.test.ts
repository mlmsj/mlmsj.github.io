import { describe, expect, it } from "vitest";
import { categories } from "./categories";
import {
  canDisplayResourceMetadata,
  canExposeShareLink,
  canProjectApprovedDeliveryToV1,
  canRedistributeDelivery,
  countDistinctResourcesForCategory,
  evaluateDeliveryShareLinkGate,
  fromLegacyCategory,
  getCategoryDepth,
  hasDeliveryAuthorization,
  hasResourceAuthorization,
  isCategoryInPublicClosure,
  projectLegacyManifestRecordToV2,
  projectCategoryToV1,
  resolveCanonicalCategoryId,
  UNIVERSITY_DOMAIN_CATEGORIES,
  UNIVERSITY_DOMAIN_IDS,
  validateCategoryAliases,
  validateCategoryGraph,
  validateResourceCategories,
  type AuthorizationEvidence,
  type CategoryAlias,
  type CategoryV2,
  type ResourceCategory,
  type ResourceDeliveryV2,
  type ResourceV2,
} from "./catalogV2";
import type { PublicManifestRecord } from "./publicManifest";

const context = {
  audience: "public",
  platform: "web",
  now: "2026-11-01T00:00:00Z",
} as const;

const deepCategories: readonly CategoryV2[] = [
  {
    id: "root",
    parentId: null,
    name: "根",
    description: "",
    sortOrder: 1,
    lifecycleStatus: "active",
  },
  {
    id: "level-2",
    parentId: "root",
    name: "二级",
    description: "",
    sortOrder: 1,
    lifecycleStatus: "active",
  },
  {
    id: "level-3",
    parentId: "level-2",
    name: "三级",
    description: "",
    sortOrder: 1,
    lifecycleStatus: "active",
  },
  {
    id: "level-4",
    parentId: "level-3",
    name: "四级",
    description: "",
    sortOrder: 1,
    lifecycleStatus: "active",
  },
];

const resource: ResourceV2 = {
  resourceId: "resource-1",
  title: "示例资料",
  browseState: "observed",
  classificationStatus: "classified",
  publicationStatus: "published",
};

const delivery: ResourceDeliveryV2 = {
  deliveryId: "delivery-a",
  resourceId: resource.resourceId,
  provider: "quark",
  shareUrl: "https://pan.quark.cn/s/example",
  accessStatus: "verified",
};

const resourceEvidence: AuthorizationEvidence = {
  evidenceId: "evidence-resource",
  subjectType: "resource",
  resourceId: resource.resourceId,
  actionScope: ["display_metadata", "expose_share_link"],
  audienceScope: ["public"],
  platformScope: ["web"],
  status: "approved",
};

const deliveryEvidence: AuthorizationEvidence = {
  evidenceId: "evidence-delivery-a",
  subjectType: "delivery",
  resourceId: resource.resourceId,
  deliveryId: delivery.deliveryId,
  actionScope: ["expose_share_link"],
  audienceScope: ["public"],
  platformScope: ["web"],
  status: "approved",
};

const legacyRecord: PublicManifestRecord = {
  id: resource.resourceId,
  title: resource.title,
  categoryId: "level-4",
  provider: "quark",
  shareUrl: "https://pan.quark.cn/s/example",
  accessStatus: "verified",
  publishedAt: "2026-10-01T00:00:00Z",
};

describe("approved university domain projection", () => {
  it("keeps exactly the nine approved domains and no tenth domain", () => {
    expect(UNIVERSITY_DOMAIN_IDS).toHaveLength(9);
    expect(new Set(UNIVERSITY_DOMAIN_IDS).size).toBe(9);
    expect(UNIVERSITY_DOMAIN_CATEGORIES).toHaveLength(10);
    expect(
      UNIVERSITY_DOMAIN_CATEGORIES.filter((category) =>
        UNIVERSITY_DOMAIN_IDS.includes(category.id as (typeof UNIVERSITY_DOMAIN_IDS)[number]),
      ),
    ).toHaveLength(9);
    expect(validateCategoryGraph(UNIVERSITY_DOMAIN_CATEGORIES)).toEqual([]);
  });
});

describe("v2 category graph", () => {
  it("derives arbitrary depth from parentId and rejects deep v1 projection", () => {
    expect(getCategoryDepth("level-4", deepCategories)).toBe(4);
    expect(projectCategoryToV1("level-4", deepCategories)).toEqual({
      ok: false,
      reason: "deep-category-not-representable",
    });
  });

  it("keeps an inactive parent out of the public closure", () => {
    const values = deepCategories.map((category) =>
      category.id === "level-2"
        ? { ...category, lifecycleStatus: "disabled" as const }
        : category,
    );
    expect(isCategoryInPublicClosure("level-4", values)).toBe(false);
  });

  it("detects cycles and missing parents without relying on level", () => {
    const values: readonly CategoryV2[] = [
      {
        ...deepCategories[0],
        parentId: "cycle-b",
      },
      {
        ...deepCategories[1],
        id: "cycle-b",
        parentId: "root",
      },
      {
        ...deepCategories[2],
        id: "orphan",
        parentId: "missing",
      },
    ];
    const issues = validateCategoryGraph(values);
    expect(issues.some((issue) => issue.code === "cycle")).toBe(true);
    expect(issues.some((issue) => issue.code === "missing-parent")).toBe(
      true,
    );
  });

  it("projects legacy IDs without changing their v1 meaning", () => {
    const legacy = fromLegacyCategory(categories[5]);
    expect(legacy.id).toBe("type-junior-math-notes");
    expect(legacy.legacyLevel).toBe(3);
    expect(projectCategoryToV1(legacy.id, [
      fromLegacyCategory(categories[0]),
      fromLegacyCategory(categories[4]),
      legacy,
    ])).toMatchObject({ ok: true });
  });
});

describe("v2 category aliases and relations", () => {
  it("resolves aliases to one canonical category before counting", () => {
    const aliases: readonly CategoryAlias[] = [
      {
        aliasId: "legacy-level-4",
        alias: "旧四级名称",
        canonicalCategoryId: "level-4",
      },
    ];
    expect(validateCategoryAliases(aliases, deepCategories)).toEqual([]);
    expect(
      resolveCanonicalCategoryId("旧四级名称", deepCategories, aliases),
    ).toBe("level-4");
  });

  it("rejects aliases with duplicate or missing canonical targets", () => {
    const aliases: readonly CategoryAlias[] = [
      { aliasId: "same", alias: "重复", canonicalCategoryId: "root" },
      { aliasId: "same", alias: "重复", canonicalCategoryId: "missing" },
    ];
    const issues = validateCategoryAliases(aliases, deepCategories);
    expect(issues.some((issue) => issue.code === "duplicate-alias-id")).toBe(
      true,
    );
    expect(issues.some((issue) => issue.code === "duplicate-alias")).toBe(
      true,
    );
    expect(issues.some((issue) => issue.code === "missing-canonical")).toBe(
      true,
    );
  });

  it("counts distinct resources across primary and secondary relations", () => {
    const relations: readonly ResourceCategory[] = [
      { resourceId: "r1", categoryId: "level-4", role: "primary" },
      { resourceId: "r1", categoryId: "level-3", role: "secondary" },
      { resourceId: "r2", categoryId: "level-4", role: "secondary" },
    ];
    expect(
      countDistinctResourcesForCategory("level-3", relations, deepCategories),
    ).toBe(2);
    expect(validateResourceCategories(relations, deepCategories)).toEqual([]);
  });

  it("rejects duplicate relations and multiple primary categories", () => {
    const relations: readonly ResourceCategory[] = [
      { resourceId: "r1", categoryId: "level-4", role: "primary" },
      { resourceId: "r1", categoryId: "level-4", role: "secondary" },
      { resourceId: "r1", categoryId: "level-3", role: "primary" },
    ];
    const issues = validateResourceCategories(relations, deepCategories);
    expect(issues.some((issue) => issue.code === "duplicate-relation")).toBe(
      true,
    );
    expect(issues.some((issue) => issue.code === "multiple-primary")).toBe(
      true,
    );
  });
});

describe("resource and delivery authorization", () => {
  it("requires resource and exact delivery authorization for a share link", () => {
    expect(
      canExposeShareLink(
        resource,
        delivery,
        true,
        context,
        [resourceEvidence, deliveryEvidence],
      ),
    ).toBe(true);
    expect(
      hasResourceAuthorization(
        resource.resourceId,
        "expose_share_link",
        context,
        [resourceEvidence],
      ),
    ).toBe(true);
    expect(
      hasDeliveryAuthorization(
        resource.resourceId,
        delivery.deliveryId,
        "expose_share_link",
        context,
        [deliveryEvidence],
      ),
    ).toBe(true);
  });

  it("does not let another delivery or verified access authorize this delivery", () => {
    const otherDelivery = { ...delivery, deliveryId: "delivery-b" };
    expect(
      canExposeShareLink(
        resource,
        otherDelivery,
        true,
        context,
        [resourceEvidence, deliveryEvidence],
      ),
    ).toBe(false);
    expect(
      canExposeShareLink(resource, delivery, true, context, [resourceEvidence]),
    ).toBe(false);
  });

  it("keeps metadata display separate from share-link authorization", () => {
    expect(
      canDisplayResourceMetadata(resource, true, context, [resourceEvidence]),
    ).toBe(true);
    expect(
      canExposeShareLink(resource, delivery, true, context, [resourceEvidence]),
    ).toBe(false);
  });

  it("does not infer authorization from accessStatus", () => {
    const pendingEvidence = {
      ...deliveryEvidence,
      status: "pending" as const,
    };
    expect(
      canExposeShareLink(
        resource,
        delivery,
        true,
        context,
        [resourceEvidence, pendingEvidence],
      ),
    ).toBe(false);
  });

  it("keeps redistribution as a separate action scope", () => {
    expect(
      canRedistributeDelivery(
        resource,
        delivery,
        true,
        context,
        [resourceEvidence, deliveryEvidence],
      ),
    ).toBe(false);

    const resourceRedistributionEvidence = {
      ...resourceEvidence,
      actionScope: ["display_metadata", "expose_share_link", "redistribute"] as const,
    };
    const deliveryRedistributionEvidence = {
      ...deliveryEvidence,
      actionScope: ["redistribute"] as const,
    };
    expect(
      canRedistributeDelivery(
        resource,
        delivery,
        true,
        context,
        [resourceRedistributionEvidence, deliveryRedistributionEvidence],
      ),
    ).toBe(true);
  });

  it("requires verified access independently of approved authorization", () => {
    const uncheckedDelivery = {
      ...delivery,
      accessStatus: "unchecked" as const,
    };
    expect(
      canExposeShareLink(
        resource,
        uncheckedDelivery,
        true,
        context,
        [resourceEvidence, deliveryEvidence],
      ),
    ).toBe(false);
  });

  it("blocks an unobserved source even when access and authorization pass", () => {
    const projection = projectLegacyManifestRecordToV2(legacyRecord, {
      deliveryId: delivery.deliveryId,
      browseState: "unexpanded",
    });
    const result = evaluateDeliveryShareLinkGate(
      projection.resource,
      projection.delivery,
      true,
      context,
      [resourceEvidence, deliveryEvidence],
    );
    expect(result.ok).toBe(false);
    expect(result.issues).toContain("resource-browse-not-observed");
  });

  it("keeps v1 as a gated compatibility projection without creating v2 data", () => {
    const projection = projectLegacyManifestRecordToV2(legacyRecord, {
      deliveryId: delivery.deliveryId,
      browseState: "observed",
    });
    expect(projection.resource.resourceId).toBe(legacyRecord.id);
    expect(projection.category.categoryId).toBe(legacyRecord.categoryId);
    expect(
      canProjectApprovedDeliveryToV1(
        legacyRecord,
        projection.resource,
        projection.delivery,
        true,
        context,
        [],
      ).ok,
    ).toBe(false);
    expect(
      canProjectApprovedDeliveryToV1(
        legacyRecord,
        projection.resource,
        projection.delivery,
        true,
        context,
        [resourceEvidence, deliveryEvidence],
      ).ok,
    ).toBe(true);
  });
});
