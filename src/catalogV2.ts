import type { Category, CategoryLevel } from "./categories";
import {
  isAllowedPublicShareUrl,
  type PublicAccessStatus,
  type PublicManifestRecord,
  type PublicManifestProvider,
} from "./publicManifest";

export const CATEGORY_LIFECYCLE_STATUSES = [
  "active",
  "disabled",
  "retired",
] as const;
export type CategoryLifecycleStatus =
  (typeof CATEGORY_LIFECYCLE_STATUSES)[number];

export type CategoryV2 = {
  id: string;
  parentId: string | null;
  name: string;
  description: string;
  sortOrder: number;
  lifecycleStatus: CategoryLifecycleStatus;
  /** Present only when the node originated from the v1 three-level model. */
  legacyLevel?: CategoryLevel;
};

export const UNIVERSITY_DOMAIN_IDS = [
  "domain-university-major",
  "domain-university-politics",
  "domain-university-english-exam",
  "domain-university-computer-exam",
  "domain-university-competition",
  "domain-university-postgraduate",
  "domain-university-planning",
  "domain-university-proof",
  "domain-university-review",
] as const;

export type UniversityDomainId = (typeof UNIVERSITY_DOMAIN_IDS)[number];

/**
 * The approved university domain layer is an internal v2 design projection.
 * It is intentionally not added to the v1 categories array or manifest.
 */
export const UNIVERSITY_DOMAIN_CATEGORIES: readonly CategoryV2[] = [
  {
    id: "stage-university",
    parentId: null,
    name: "大学",
    description: "大学课程与考试资料",
    sortOrder: 30,
    lifecycleStatus: "active",
    legacyLevel: 1,
  },
  {
    id: "domain-university-major",
    parentId: "stage-university",
    name: "专业课",
    description: "大学专业课、数学与教材语义",
    sortOrder: 10,
    lifecycleStatus: "active",
    legacyLevel: 2,
  },
  {
    id: "domain-university-politics",
    parentId: "stage-university",
    name: "思政",
    description: "大学思政课程资料",
    sortOrder: 20,
    lifecycleStatus: "active",
    legacyLevel: 2,
  },
  {
    id: "domain-university-english-exam",
    parentId: "stage-university",
    name: "英语考试",
    description: "四六级、雅思及相关考试资料",
    sortOrder: 30,
    lifecycleStatus: "active",
    legacyLevel: 2,
  },
  {
    id: "domain-university-computer-exam",
    parentId: "stage-university",
    name: "计算机考试",
    description: "大学计算机考试资料",
    sortOrder: 40,
    lifecycleStatus: "active",
    legacyLevel: 2,
  },
  {
    id: "domain-university-competition",
    parentId: "stage-university",
    name: "竞赛",
    description: "大学竞赛资料",
    sortOrder: 50,
    lifecycleStatus: "active",
    legacyLevel: 2,
  },
  {
    id: "domain-university-postgraduate",
    parentId: "stage-university",
    name: "升学",
    description: "考研及相关升学资料",
    sortOrder: 60,
    lifecycleStatus: "active",
    legacyLevel: 2,
  },
  {
    id: "domain-university-planning",
    parentId: "stage-university",
    name: "规划",
    description: "职业生涯规划资料",
    sortOrder: 70,
    lifecycleStatus: "active",
    legacyLevel: 2,
  },
  {
    id: "domain-university-proof",
    parentId: "stage-university",
    name: "模板与证明",
    description: "模板与证明资料，需单独审核",
    sortOrder: 80,
    lifecycleStatus: "active",
    legacyLevel: 2,
  },
  {
    id: "domain-university-review",
    parentId: "stage-university",
    name: "复习资料",
    description: "独立于专业课的复习资料域",
    sortOrder: 90,
    lifecycleStatus: "active",
    legacyLevel: 2,
  },
];

export type CategoryGraphIssue = {
  code:
    | "duplicate-id"
    | "missing-parent"
    | "cycle"
    | "duplicate-sibling-name";
  categoryId: string;
  message: string;
};

const getUniqueCategoryMap = (values: readonly CategoryV2[]) => {
  const byId = new Map<string, CategoryV2>();
  for (const category of values) {
    if (byId.has(category.id)) return null;
    byId.set(category.id, category);
  }
  return byId;
};

export const validateCategoryGraph = (
  values: readonly CategoryV2[],
): readonly CategoryGraphIssue[] => {
  const issues: CategoryGraphIssue[] = [];
  const byId = new Map<string, CategoryV2>();

  for (const category of values) {
    if (byId.has(category.id)) {
      issues.push({
        code: "duplicate-id",
        categoryId: category.id,
        message: `分类 ID 重复：${category.id}`,
      });
    } else {
      byId.set(category.id, category);
    }
  }

  for (const category of values) {
    if (category.parentId !== null && !byId.has(category.parentId)) {
      issues.push({
        code: "missing-parent",
        categoryId: category.id,
        message: `分类缺少有效父级：${category.id}`,
      });
    }

    const visited = new Set<string>([category.id]);
    let parentId = category.parentId;
    while (parentId) {
      if (visited.has(parentId)) {
        issues.push({
          code: "cycle",
          categoryId: category.id,
          message: `分类关系存在循环：${category.id}`,
        });
        break;
      }
      visited.add(parentId);
      parentId = byId.get(parentId)?.parentId ?? null;
    }
  }

  const siblingNames = new Map<string, string>();
  for (const category of values) {
    const key = `${category.parentId ?? "root"}\u0000${category.name.trim()}`;
    const existingId = siblingNames.get(key);
    if (existingId && existingId !== category.id) {
      issues.push({
        code: "duplicate-sibling-name",
        categoryId: category.id,
        message: `同一父级下分类名称重复：${category.name}`,
      });
    } else {
      siblingNames.set(key, category.id);
    }
  }

  return issues;
};

export const getCategoryAncestry = (
  id: string,
  values: readonly CategoryV2[],
): readonly CategoryV2[] | null => {
  const byId = getUniqueCategoryMap(values);
  if (!byId) return null;

  const path: CategoryV2[] = [];
  const visited = new Set<string>();
  let current = byId.get(id);

  while (current) {
    if (visited.has(current.id)) return null;
    visited.add(current.id);
    path.unshift(current);
    current = current.parentId ? byId.get(current.parentId) : undefined;
    if (path.length > values.length) return null;
  }

  if (path.length === 0) return null;
  const terminal = path[0];
  if (terminal.parentId !== null) return null;
  return path;
};

export const getCategoryDepth = (
  id: string,
  values: readonly CategoryV2[],
): number | null => getCategoryAncestry(id, values)?.length ?? null;

export const isCategoryInPublicClosure = (
  id: string,
  values: readonly CategoryV2[],
): boolean =>
  getCategoryAncestry(id, values)?.every(
    (category) => category.lifecycleStatus === "active",
  ) ?? false;

export const getCategoryChildren = (
  parentId: string | null,
  values: readonly CategoryV2[],
): readonly CategoryV2[] =>
  [...values]
    .filter(
      (category) =>
        category.parentId === parentId &&
        category.lifecycleStatus === "active",
    )
    .sort(
      (left, right) =>
        left.sortOrder - right.sortOrder ||
        left.name.localeCompare(right.name, "zh-CN") ||
        left.id.localeCompare(right.id),
    );

export const fromLegacyCategory = (category: Category): CategoryV2 => ({
  id: category.id,
  parentId: category.parentId,
  name: category.name,
  description: category.description,
  sortOrder: category.sortOrder,
  lifecycleStatus: category.enabled ? "active" : "disabled",
  legacyLevel: category.level,
});

export type V1CategoryProjection =
  | { ok: true; category: Category }
  | {
      ok: false;
      reason:
        | "not-found"
        | "invalid-path"
        | "deep-category-not-representable";
    };

export const projectCategoryToV1 = (
  id: string,
  values: readonly CategoryV2[],
): V1CategoryProjection => {
  const path = getCategoryAncestry(id, values);
  if (!path) {
    return {
      ok: false,
      reason: values.some((category) => category.id === id)
        ? "invalid-path"
        : "not-found",
    };
  }
  if (path.length > 3) {
    return { ok: false, reason: "deep-category-not-representable" };
  }

  const category = path[path.length - 1];
  return {
    ok: true,
    category: {
      id: category.id,
      parentId: category.parentId,
      name: category.name,
      description: category.description,
      level: path.length as CategoryLevel,
      sortOrder: category.sortOrder,
      enabled: category.lifecycleStatus === "active",
    },
  };
};

export type CategoryAlias = {
  aliasId: string;
  alias: string;
  canonicalCategoryId: string;
};

export type CategoryAliasIssue = {
  code: "duplicate-alias-id" | "duplicate-alias" | "missing-canonical";
  aliasId: string;
  message: string;
};

export const validateCategoryAliases = (
  aliases: readonly CategoryAlias[],
  categories: readonly CategoryV2[],
): readonly CategoryAliasIssue[] => {
  const issues: CategoryAliasIssue[] = [];
  const categoryIds = new Set(categories.map((category) => category.id));
  const aliasIds = new Set<string>();
  const aliasNames = new Set<string>();

  for (const entry of aliases) {
    if (aliasIds.has(entry.aliasId)) {
      issues.push({
        code: "duplicate-alias-id",
        aliasId: entry.aliasId,
        message: `分类别名 ID 重复：${entry.aliasId}`,
      });
    }
    aliasIds.add(entry.aliasId);

    const aliasName = entry.alias.trim();
    if (aliasNames.has(aliasName)) {
      issues.push({
        code: "duplicate-alias",
        aliasId: entry.aliasId,
        message: `分类别名名称重复：${entry.alias}`,
      });
    }
    aliasNames.add(aliasName);

    if (!categoryIds.has(entry.canonicalCategoryId)) {
      issues.push({
        code: "missing-canonical",
        aliasId: entry.aliasId,
        message: `分类别名缺少唯一规范目标：${entry.aliasId}`,
      });
    }
  }

  return issues;
};

export const resolveCanonicalCategoryId = (
  input: string,
  categories: readonly CategoryV2[],
  aliases: readonly CategoryAlias[],
): string | null => {
  if (categories.some((category) => category.id === input)) return input;

  const matches = aliases.filter(
    (entry) => entry.aliasId === input || entry.alias.trim() === input.trim(),
  );
  if (matches.length !== 1) return null;

  const target = matches[0].canonicalCategoryId;
  return categories.some((category) => category.id === target) ? target : null;
};

export type BrowseState =
  | "observed"
  | "unexpanded"
  | "browse_failed"
  | "missing"
  | "retired";

export type ResourceClassificationStatus = "classified" | "pending";
export type PublicationStatus = "draft" | "published" | "withdrawn";

export type ResourceV2 = {
  resourceId: string;
  title: string;
  browseState: BrowseState;
  classificationStatus: ResourceClassificationStatus;
  publicationStatus: PublicationStatus;
};

export type ResourceDeliveryV2 = {
  deliveryId: string;
  resourceId: string;
  provider: PublicManifestProvider;
  shareUrl: string | null;
  accessStatus: PublicAccessStatus;
  checkedOn?: string | null;
};

export type LegacyV1ProjectionOptions = {
  /**
   * v1 has no delivery identity or source browse state. Both are required
   * inputs so the adapter cannot silently invent either fact.
   */
  deliveryId: string;
  browseState: BrowseState;
};

export type LegacyV1Projection = {
  resource: ResourceV2;
  delivery: ResourceDeliveryV2;
  category: ResourceCategory;
};

/**
 * Projects one already-validated v1 record into the internal v2 shape.
 * This is a compatibility adapter only: it does not create authorization
 * evidence, change the v1 record, or imply that access verification is an
 * authorization approval.
 */
export const projectLegacyManifestRecordToV2 = (
  record: PublicManifestRecord,
  options: LegacyV1ProjectionOptions,
): LegacyV1Projection => {
  if (!options.deliveryId.trim()) {
    throw new Error("v2 deliveryId 不能为空");
  }

  return {
    resource: {
      resourceId: record.id,
      title: record.title,
      browseState: options.browseState,
      classificationStatus: "classified",
      publicationStatus:
        record.accessStatus === "withdrawn"
          ? "withdrawn"
          : record.accessStatus === "verified"
            ? "published"
            : "draft",
    },
    delivery: {
      deliveryId: options.deliveryId,
      resourceId: record.id,
      provider: record.provider,
      shareUrl: record.shareUrl,
      accessStatus: record.accessStatus,
      checkedOn: record.checkedOn ?? null,
    },
    category: {
      resourceId: record.id,
      categoryId: record.categoryId,
      role: "primary",
    },
  };
};

export type ResourceCategoryRole = "primary" | "secondary";

export type ResourceCategory = {
  resourceId: string;
  categoryId: string;
  role: ResourceCategoryRole;
};

export type ResourceCategoryIssue = {
  code: "missing-category" | "duplicate-relation" | "multiple-primary";
  resourceId: string;
  message: string;
};

export const validateResourceCategories = (
  relations: readonly ResourceCategory[],
  categories: readonly CategoryV2[],
): readonly ResourceCategoryIssue[] => {
  const issues: ResourceCategoryIssue[] = [];
  const categoryIds = new Set(categories.map((category) => category.id));
  const relationKeys = new Set<string>();
  const primaryByResource = new Set<string>();

  for (const relation of relations) {
    if (!categoryIds.has(relation.categoryId)) {
      issues.push({
        code: "missing-category",
        resourceId: relation.resourceId,
        message: `资源分类关系指向不存在的分类：${relation.categoryId}`,
      });
    }

    const relationKey = `${relation.resourceId}\u0000${relation.categoryId}`;
    if (relationKeys.has(relationKey)) {
      issues.push({
        code: "duplicate-relation",
        resourceId: relation.resourceId,
        message: `资源分类关系重复：${relation.resourceId}/${relation.categoryId}`,
      });
    }
    relationKeys.add(relationKey);

    if (relation.role === "primary") {
      if (primaryByResource.has(relation.resourceId)) {
        issues.push({
          code: "multiple-primary",
          resourceId: relation.resourceId,
          message: `资源只能有一个 primary 分类：${relation.resourceId}`,
        });
      }
      primaryByResource.add(relation.resourceId);
    }
  }

  return issues;
};

export const countDistinctResourcesForCategory = (
  categoryInput: string,
  relations: readonly ResourceCategory[],
  categories: readonly CategoryV2[],
  aliases: readonly CategoryAlias[] = [],
): number => {
  const categoryId = resolveCanonicalCategoryId(
    categoryInput,
    categories,
    aliases,
  );
  if (!categoryId || !isCategoryInPublicClosure(categoryId, categories)) {
    return 0;
  }

  const resourceIds = new Set<string>();
  for (const relation of relations) {
    const relationPath = getCategoryAncestry(relation.categoryId, categories);
    if (
      relationPath?.some((category) => category.id === categoryId) &&
      relationPath.every((category) => category.lifecycleStatus === "active")
    ) {
      resourceIds.add(relation.resourceId);
    }
  }
  return resourceIds.size;
};

export const AUTHORIZATION_STATUSES = [
  "unknown",
  "pending",
  "approved",
  "denied",
  "expired",
] as const;
export type AuthorizationStatus = (typeof AUTHORIZATION_STATUSES)[number];

export const AUTHORIZATION_ACTIONS = [
  "display_metadata",
  "expose_share_link",
  "redistribute",
] as const;
export type AuthorizationAction = (typeof AUTHORIZATION_ACTIONS)[number];

type AuthorizationEvidenceBase = {
  evidenceId: string;
  resourceId: string;
  actionScope: readonly AuthorizationAction[];
  audienceScope: readonly string[];
  platformScope: readonly string[];
  status: AuthorizationStatus;
  validFrom?: string | null;
  validUntil?: string | null;
  evidenceRef?: string | null;
  reviewedAt?: string | null;
};

export type ResourceAuthorizationEvidence = AuthorizationEvidenceBase & {
  subjectType: "resource";
  deliveryId?: never;
};

export type DeliveryAuthorizationEvidence = AuthorizationEvidenceBase & {
  subjectType: "delivery";
  deliveryId: string;
};

export type AuthorizationEvidence =
  | ResourceAuthorizationEvidence
  | DeliveryAuthorizationEvidence;

export type AuthorizationContext = {
  audience: string;
  platform: string;
  now: string;
};

const isEvidenceCurrentlyValid = (
  evidence: AuthorizationEvidence,
  context: AuthorizationContext,
) => {
  if (evidence.status !== "approved") return false;

  const now = Date.parse(context.now);
  if (!Number.isFinite(now)) return false;

  if (evidence.validFrom !== null && evidence.validFrom !== undefined) {
    const validFrom = Date.parse(evidence.validFrom);
    if (!Number.isFinite(validFrom) || now < validFrom) return false;
  }

  if (evidence.validUntil !== null && evidence.validUntil !== undefined) {
    const validUntil = Date.parse(evidence.validUntil);
    if (!Number.isFinite(validUntil) || now >= validUntil) return false;
  }

  return true;
};

const evidenceCovers = (
  evidence: AuthorizationEvidence,
  action: AuthorizationAction,
  context: AuthorizationContext,
) =>
  evidence.actionScope.includes(action) &&
  evidence.audienceScope.includes(context.audience) &&
  evidence.platformScope.includes(context.platform) &&
  isEvidenceCurrentlyValid(evidence, context);

export const hasResourceAuthorization = (
  resourceId: string,
  action: AuthorizationAction,
  context: AuthorizationContext,
  evidence: readonly AuthorizationEvidence[],
) =>
  evidence.some(
    (entry) =>
      entry.subjectType === "resource" &&
      entry.resourceId === resourceId &&
      evidenceCovers(entry, action, context),
  );

export const hasDeliveryAuthorization = (
  resourceId: string,
  deliveryId: string,
  action: AuthorizationAction,
  context: AuthorizationContext,
  evidence: readonly AuthorizationEvidence[],
) =>
  evidence.some(
    (entry) =>
      entry.subjectType === "delivery" &&
      entry.resourceId === resourceId &&
      entry.deliveryId === deliveryId &&
      evidenceCovers(entry, action, context),
  );

export type PublicGateIssueCode =
  | "resource-browse-not-observed"
  | "resource-not-classified"
  | "resource-not-published"
  | "category-not-public"
  | "delivery-resource-mismatch"
  | "delivery-not-verified"
  | "delivery-share-url-invalid"
  | "legacy-record-delivery-mismatch"
  | "resource-authorization-missing"
  | "delivery-authorization-missing";

export type PublicGateResult = {
  ok: boolean;
  issues: readonly PublicGateIssueCode[];
};

const getResourceListingIssues = (
  resource: ResourceV2,
  categoryIsPublic: boolean,
): PublicGateIssueCode[] => {
  const issues: PublicGateIssueCode[] = [];
  if (resource.browseState !== "observed") {
    issues.push("resource-browse-not-observed");
  }
  if (resource.classificationStatus !== "classified") {
    issues.push("resource-not-classified");
  }
  if (resource.publicationStatus !== "published") {
    issues.push("resource-not-published");
  }
  if (!categoryIsPublic) issues.push("category-not-public");
  return issues;
};

export const evaluateResourceMetadataGate = (
  resource: ResourceV2,
  categoryIsPublic: boolean,
  context: AuthorizationContext,
  evidence: readonly AuthorizationEvidence[],
): PublicGateResult => {
  const issues = getResourceListingIssues(resource, categoryIsPublic);
  if (
    !hasResourceAuthorization(
      resource.resourceId,
      "display_metadata",
      context,
      evidence,
    )
  ) {
    issues.push("resource-authorization-missing");
  }
  return { ok: issues.length === 0, issues };
};

const evaluateDeliveryGate = (
  resource: ResourceV2,
  delivery: ResourceDeliveryV2,
  categoryIsPublic: boolean,
  action: Extract<AuthorizationAction, "expose_share_link" | "redistribute">,
  context: AuthorizationContext,
  evidence: readonly AuthorizationEvidence[],
): PublicGateResult => {
  const issues = getResourceListingIssues(resource, categoryIsPublic);

  if (delivery.resourceId !== resource.resourceId) {
    issues.push("delivery-resource-mismatch");
  }
  if (delivery.accessStatus !== "verified") {
    issues.push("delivery-not-verified");
  }
  if (!isAllowedPublicShareUrl(delivery.provider, delivery.shareUrl)) {
    issues.push("delivery-share-url-invalid");
  }

  if (
    !hasResourceAuthorization(
      resource.resourceId,
      action,
      context,
      evidence,
    ) ||
    (action === "expose_share_link" &&
      !hasResourceAuthorization(
        resource.resourceId,
        "display_metadata",
        context,
        evidence,
      ))
  ) {
    issues.push("resource-authorization-missing");
  }

  if (
    !hasDeliveryAuthorization(
      resource.resourceId,
      delivery.deliveryId,
      action,
      context,
      evidence,
    )
  ) {
    issues.push("delivery-authorization-missing");
  }

  return { ok: issues.length === 0, issues };
};

export const canDisplayResourceMetadata = (
  resource: ResourceV2,
  categoryIsPublic: boolean,
  context: AuthorizationContext,
  evidence: readonly AuthorizationEvidence[],
) => evaluateResourceMetadataGate(resource, categoryIsPublic, context, evidence).ok;

export const canPerformDeliveryAction = (
  resource: ResourceV2,
  delivery: ResourceDeliveryV2,
  categoryIsPublic: boolean,
  action: Extract<AuthorizationAction, "expose_share_link" | "redistribute">,
  context: AuthorizationContext,
  evidence: readonly AuthorizationEvidence[],
) =>
  evaluateDeliveryGate(
    resource,
    delivery,
    categoryIsPublic,
    action,
    context,
    evidence,
  ).ok;

export const evaluateDeliveryShareLinkGate = (
  resource: ResourceV2,
  delivery: ResourceDeliveryV2,
  categoryIsPublic: boolean,
  context: AuthorizationContext,
  evidence: readonly AuthorizationEvidence[],
) =>
  evaluateDeliveryGate(
    resource,
    delivery,
    categoryIsPublic,
    "expose_share_link",
    context,
    evidence,
  );

export const canProjectApprovedDeliveryToV1 = (
  record: PublicManifestRecord,
  resource: ResourceV2,
  delivery: ResourceDeliveryV2,
  categoryIsPublic: boolean,
  context: AuthorizationContext,
  evidence: readonly AuthorizationEvidence[],
): PublicGateResult => {
  const issues = evaluateDeliveryShareLinkGate(
    resource,
    delivery,
    categoryIsPublic,
    context,
    evidence,
  ).issues.slice() as PublicGateIssueCode[];

  if (record.id !== resource.resourceId || record.id !== delivery.resourceId) {
    issues.push("delivery-resource-mismatch");
  }
  if (record.provider !== delivery.provider || record.shareUrl !== delivery.shareUrl) {
    issues.push("delivery-share-url-invalid");
  }
  if (record.accessStatus !== delivery.accessStatus) {
    issues.push("legacy-record-delivery-mismatch");
  }

  return { ok: issues.length === 0, issues: [...new Set(issues)] };
};

export const canExposeShareLink = (
  resource: ResourceV2,
  delivery: ResourceDeliveryV2,
  categoryIsPublic: boolean,
  context: AuthorizationContext,
  evidence: readonly AuthorizationEvidence[],
) =>
  canPerformDeliveryAction(
    resource,
    delivery,
    categoryIsPublic,
    "expose_share_link",
    context,
    evidence,
  );

export const canRedistributeDelivery = (
  resource: ResourceV2,
  delivery: ResourceDeliveryV2,
  categoryIsPublic: boolean,
  context: AuthorizationContext,
  evidence: readonly AuthorizationEvidence[],
) =>
  canPerformDeliveryAction(
    resource,
    delivery,
    categoryIsPublic,
    "redistribute",
    context,
    evidence,
  );
