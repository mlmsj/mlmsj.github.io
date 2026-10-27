import type { Candidate } from "../manualImport/types";
import type { Provider } from "../types";
import {
  REVIEW_CARD_SCHEMA_VERSION,
  type CandidateReviewConversionErrorCode,
  type CandidateReviewConversionResult,
  type CandidateReviewDraftConversion,
  type CandidateReviewStatus,
  type DuplicateCheckStatus,
  type EvidenceStatus,
  type HumanReviewDecision,
  type ReviewCardAnonymousAccess,
  type ReviewCardCorrespondence,
  type ReviewCardCurrentShareStatus,
  type ReviewCardDirectoryMarker,
  type ReviewCardDraft,
  type ReviewCardDuplicateCheck,
  type ReviewCardEvidence,
  type ReviewCardHistoricalMapping,
  type ReviewCardHumanReview,
  type ReviewCardLicense,
  type ReviewCardOverlapAndDuplicates,
  type ReviewCardPath,
  type ReviewCardPendingItem,
  type ReviewCardReadinessGate,
  type ReviewCardRedistributionLicense,
  type ReviewCardRights,
  type ReviewCardScope,
  type ReviewCardShareEvidence,
  type ProductDecisionStatus,
} from "./types";

type SafeRecord = Record<string, unknown>;
type CandidateId =
  | "B01-BAIDU-COLLECTION"
  | "B02-CET4-BAIDU"
  | "B02-CET6-BAIDU"
  | "Q-B01-UNMAPPED"
  | "Q-B02-CET4-UNMAPPED"
  | "Q-B02-CET6-UNMAPPED";

type CandidateSpec = {
  readonly recordId: CandidateId;
  readonly candidateGroup: "B-01" | "B-02";
  readonly candidateKind: string;
  readonly platform: Provider;
  readonly correspondence: CandidateId | null;
};

const CANDIDATE_SPECS: readonly CandidateSpec[] = [
  {
    recordId: "B01-BAIDU-COLLECTION",
    candidateGroup: "B-01",
    candidateKind: "collection",
    platform: "baidu",
    correspondence: null,
  },
  {
    recordId: "B02-CET4-BAIDU",
    candidateGroup: "B-02",
    candidateKind: "independent_level_entry",
    platform: "baidu",
    correspondence: null,
  },
  {
    recordId: "B02-CET6-BAIDU",
    candidateGroup: "B-02",
    candidateKind: "independent_level_entry",
    platform: "baidu",
    correspondence: null,
  },
  {
    recordId: "Q-B01-UNMAPPED",
    candidateGroup: "B-01",
    candidateKind: "platform_equivalence_candidate",
    platform: "quark",
    correspondence: "B01-BAIDU-COLLECTION",
  },
  {
    recordId: "Q-B02-CET4-UNMAPPED",
    candidateGroup: "B-02",
    candidateKind: "platform_equivalence_candidate",
    platform: "quark",
    correspondence: "B02-CET4-BAIDU",
  },
  {
    recordId: "Q-B02-CET6-UNMAPPED",
    candidateGroup: "B-02",
    candidateKind: "platform_equivalence_candidate",
    platform: "quark",
    correspondence: "B02-CET6-BAIDU",
  },
] as const;

const CANDIDATE_IDS = CANDIDATE_SPECS.map((spec) => spec.recordId);
const EVIDENCE_STATUSES = ["CONFIRMED", "UNKNOWN", "NOT RUN", "BLOCKED"] as const;
const PRODUCT_DECISION_STATUSES = [...EVIDENCE_STATUSES, "CONFIRMED_FOR_INDEPENDENT_RECORD_ONLY"] as const;
const REVIEW_STATUSES = ["HOLD", "BLOCKED", "READY_FOR_REVIEW"] as const;
const DUPLICATE_STATUSES = ["PASS", "UNRESOLVED", "FAIL", "NOT RUN"] as const;
const HUMAN_REVIEW_DECISIONS = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "CHANGES_REQUESTED",
] as const;
const OVERLAP_RISKS = ["HIGH", "MEDIUM", "LOW", "UNKNOWN", "NONE"] as const;

const FORBIDDEN_KEYS = new Set([
  "passcode",
  "password",
  "cookie",
  "token",
  "access_token",
  "refresh_token",
  "fid",
  "fs_id",
  "shareid",
  "share_id",
  "cloudid",
  "cloud_id",
  "providerfileid",
  "provider_file_id",
  "opaquecloudidentifier",
  "opaque_cloud_identifier",
  "shareurl",
  "share_url",
  "sharelink",
  "share_link",
  "fullshareurl",
  "full_share_url",
  "extractcode",
  "extract_code",
  "extractioncode",
  "extraction_code",
  "accesscode",
  "access_code",
]);
const FORBIDDEN_VALUE = /(?:https?:\/\/|ftp:\/\/|\b(?:pan\.baidu\.com|pan\.quark\.cn|drive\.quark\.cn|quark\.cn)\/(?:s|share)\b|(?:passcode|password|cookie|token|access[_ -]?token|refresh[_ -]?token|secret|authorization|提取码|密码|令牌|凭证)\s*[:=]|(?:fid|fs_id|share[_ -]?id|cloud[_ -]?id)\s*[:=])/iu;
const hasControlCharacter = (value: string): boolean => {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code <= 0x08 || code === 0x0b || code === 0x0c || (code >= 0x0e && code <= 0x1f) || (code >= 0x7f && code <= 0x9f)) return true;
  }
  return false;
};

class ConversionFailure extends Error {
  readonly code: CandidateReviewConversionErrorCode;

  constructor(code: CandidateReviewConversionErrorCode) {
    super(code);
    this.code = code;
  }
}

const reject = (
  code: CandidateReviewConversionErrorCode,
): CandidateReviewConversionResult => ({
  status: "rejected",
  code,
  summary: "Conversion rejected",
});

const fail = (code: CandidateReviewConversionErrorCode): never => {
  throw new ConversionFailure(code);
};

const hasOwn = (value: SafeRecord, key: string) =>
  Object.prototype.hasOwnProperty.call(value, key);

const isPlainRecord = (value: unknown): value is SafeRecord => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  try {
    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
  } catch {
    return false;
  }
};

const ownValue = (record: SafeRecord, key: string): unknown => {
  const descriptor = Object.getOwnPropertyDescriptor(record, key);
  if (!descriptor || !("value" in descriptor)) fail("INVALID_INPUT");
  return (descriptor as PropertyDescriptor & { value: unknown }).value;
};

const inspectSafety = (value: unknown, seen = new Set<object>()): "safe" | "sensitive" | "invalid" => {
  if (typeof value === "string") return FORBIDDEN_VALUE.test(value) ? "sensitive" : "safe";
  if (value === null || typeof value === "boolean" || typeof value === "number") return "safe";
  if (typeof value !== "object") return "invalid";
  if (seen.has(value)) return "invalid";
  seen.add(value);
  try {
    if (Array.isArray(value)) {
      if (Object.getPrototypeOf(value) !== Array.prototype) return "invalid";
      for (const key of Reflect.ownKeys(value)) {
        if (key === "length") continue;
        if (typeof key !== "string" || !/^\d+$/u.test(key)) return "invalid";
        const descriptor = Object.getOwnPropertyDescriptor(value, key);
        if (!descriptor || !("value" in descriptor)) return "invalid";
        const result = inspectSafety(descriptor.value, seen);
        if (result !== "safe") return result;
      }
      return "safe";
    }
    if (!isPlainRecord(value)) return "invalid";
    for (const key of Reflect.ownKeys(value)) {
      if (typeof key !== "string") return "invalid";
      if (FORBIDDEN_KEYS.has(key.toLocaleLowerCase())) return "sensitive";
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor || !("value" in descriptor)) return "invalid";
      const result = inspectSafety(descriptor.value, seen);
      if (result !== "safe") return result;
    }
    return "safe";
  } catch {
    return "invalid";
  }
};

const requireRecord = (
  value: unknown,
  required: readonly string[],
  allowed: readonly string[],
  code: CandidateReviewConversionErrorCode,
): SafeRecord => {
  if (!isPlainRecord(value)) fail(code);
  const record = value as SafeRecord;
  for (const key of Reflect.ownKeys(record)) {
    if (typeof key !== "string" || !allowed.includes(key)) fail(code);
  }
  for (const key of required) if (!hasOwn(record, key)) fail(code);
  return record;
};

const requireArray = (
  value: unknown,
  code: CandidateReviewConversionErrorCode,
  maxLength = 128,
): readonly unknown[] => {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype || value.length > maxLength) fail(code);
  const array = value as readonly unknown[];
  if (Reflect.ownKeys(array).length !== array.length + 1) fail(code);
  for (let index = 0; index < array.length; index += 1) {
    const descriptor = Object.getOwnPropertyDescriptor(array, String(index));
    if (!descriptor || !("value" in descriptor)) fail(code);
  }
  return array;
};

const safeText = (
  value: unknown,
  code: CandidateReviewConversionErrorCode,
  maxLength = 4096,
): string => {
  if (typeof value !== "string" || value.length > maxLength || hasControlCharacter(value) || FORBIDDEN_VALUE.test(value)) fail(code);
  return value as string;
};

const nullableText = (
  value: unknown,
  code: CandidateReviewConversionErrorCode,
  maxLength = 4096,
): string | null => {
  if (value === null || value === undefined) return null;
  return safeText(value, code, maxLength);
};

const status = (value: unknown, code: CandidateReviewConversionErrorCode): EvidenceStatus => {
  if (typeof value !== "string" || !EVIDENCE_STATUSES.includes(value as EvidenceStatus)) fail(code);
  return value as EvidenceStatus;
};

const productDecisionStatus = (value: unknown): ProductDecisionStatus => {
  if (typeof value !== "string" || !PRODUCT_DECISION_STATUSES.includes(value as ProductDecisionStatus)) fail("INVALID_STATUS");
  return value as ProductDecisionStatus;
};

const reviewStatus = (value: unknown): CandidateReviewStatus => {
  if (typeof value !== "string" || !REVIEW_STATUSES.includes(value as CandidateReviewStatus)) fail("INVALID_STATUS");
  return value as CandidateReviewStatus;
};

const duplicateStatus = (value: unknown): DuplicateCheckStatus => {
  if (typeof value !== "string" || !DUPLICATE_STATUSES.includes(value as DuplicateCheckStatus)) fail("INVALID_STATUS");
  return value as DuplicateCheckStatus;
};

const humanDecision = (value: unknown): HumanReviewDecision => {
  if (typeof value !== "string" || !HUMAN_REVIEW_DECISIONS.includes(value as HumanReviewDecision)) fail("INVALID_STATUS");
  return value as HumanReviewDecision;
};

const bool = (value: unknown, code: CandidateReviewConversionErrorCode): boolean => {
  if (typeof value !== "boolean") fail(code);
  return value as boolean;
};

const nonNegativeInteger = (value: unknown, code: CandidateReviewConversionErrorCode): number => {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) fail(code);
  return value as number;
};

const nullableNonNegativeInteger = (value: unknown, code: CandidateReviewConversionErrorCode): number | null => {
  if (value === null || value === undefined) return null;
  return nonNegativeInteger(value, code);
};

const safeStringArray = (
  value: unknown,
  code: CandidateReviewConversionErrorCode,
  maxLength = 128,
): readonly string[] => {
  const values = requireArray(value, code, maxLength);
  return values.map((item) => safeText(item, code));
};

const evidenceRefs = (value: unknown): readonly string[] => {
  const refs = safeStringArray(value, "INVALID_CANDIDATE");
  for (const ref of refs) {
    if (!/^(?:[A-Za-z]:[\\/]|\.\.?[\\/]|[A-Za-z0-9_.-]+[\\/])/u.test(ref)) fail("INVALID_CANDIDATE");
  }
  return refs;
};

const optionalString = (record: SafeRecord, key: string, code: CandidateReviewConversionErrorCode): string | null =>
  hasOwn(record, key) ? nullableText(ownValue(record, key), code) : null;

const readEvidence = (value: unknown): ReviewCardEvidence => {
  const record = requireRecord(value, ["status", "value", "reason"], ["status", "value", "reason", "evidenceRefs"], "INVALID_CANDIDATE");
  return {
    status: status(ownValue(record, "status"), "INVALID_STATUS"),
    value: nullableText(ownValue(record, "value"), "INVALID_CANDIDATE"),
    reason: safeText(ownValue(record, "reason"), "INVALID_CANDIDATE"),
    evidenceRefs: hasOwn(record, "evidenceRefs") ? evidenceRefs(ownValue(record, "evidenceRefs")) : [],
  };
};

const readLicense = (value: unknown): ReviewCardLicense => {
  const record = requireRecord(value, ["status", "coversExactScope", "evidenceRefs", "reason"], ["status", "coversExactScope", "evidenceRefs", "reason"], "INVALID_CANDIDATE");
  return {
    status: status(ownValue(record, "status"), "INVALID_STATUS"),
    coversExactScope: bool(ownValue(record, "coversExactScope"), "INVALID_CANDIDATE"),
    evidenceRefs: evidenceRefs(ownValue(record, "evidenceRefs")),
    reason: safeText(ownValue(record, "reason"), "INVALID_CANDIDATE"),
  };
};

const readRedistributionLicense = (value: unknown): ReviewCardRedistributionLicense => {
  const record = requireRecord(value, ["status", "coversExactScope", "audienceAndChannelConfirmed", "evidenceRefs", "reason"], ["status", "coversExactScope", "audienceAndChannelConfirmed", "evidenceRefs", "reason"], "INVALID_CANDIDATE");
  return {
    status: status(ownValue(record, "status"), "INVALID_STATUS"),
    coversExactScope: bool(ownValue(record, "coversExactScope"), "INVALID_CANDIDATE"),
    audienceAndChannelConfirmed: bool(ownValue(record, "audienceAndChannelConfirmed"), "INVALID_CANDIDATE"),
    evidenceRefs: evidenceRefs(ownValue(record, "evidenceRefs")),
    reason: safeText(ownValue(record, "reason"), "INVALID_CANDIDATE"),
  };
};

const readRights = (value: unknown): ReviewCardRights => {
  const record = requireRecord(value, ["acquisitionSource", "rightsHolder", "writtenPublicLicense", "redistributionLicense"], ["acquisitionSource", "rightsHolder", "writtenPublicLicense", "redistributionLicense"], "INVALID_CANDIDATE");
  const acquisitionSource = readEvidence(ownValue(record, "acquisitionSource"));
  const rightsHolder = readEvidence(ownValue(record, "rightsHolder"));
  const writtenPublicLicense = readLicense(ownValue(record, "writtenPublicLicense"));
  const redistributionLicense = readRedistributionLicense(ownValue(record, "redistributionLicense"));
  if (acquisitionSource.status === "CONFIRMED" && acquisitionSource.value === null) fail("INCONSISTENT_READINESS");
  if (rightsHolder.status === "CONFIRMED" && rightsHolder.value === null) fail("INCONSISTENT_READINESS");
  if (writtenPublicLicense.status === "CONFIRMED" && !writtenPublicLicense.coversExactScope) fail("INCONSISTENT_READINESS");
  if (redistributionLicense.status === "CONFIRMED" && (!redistributionLicense.coversExactScope || !redistributionLicense.audienceAndChannelConfirmed)) fail("INCONSISTENT_READINESS");
  return { acquisitionSource, rightsHolder, writtenPublicLicense, redistributionLicense };
};

const readPath = (value: unknown): ReviewCardPath => {
  const record = requireRecord(
    value,
    ["rootAlias", "canonicalPath", "exactPathStatus", "currentDirectoryReadability", "lastEvidenceAt", "evidenceRefs"],
    ["rootAlias", "canonicalPath", "observedRelatedPath", "pathRole", "exactPathStatus", "historicalPathMappingStatus", "historicalMappingStatus", "currentDirectoryReadability", "currentShareRecordPathStatus", "lastEvidenceAt", "evidenceRefs", "reason"],
    "INVALID_CANDIDATE",
  );
  const exactPathStatus = status(ownValue(record, "exactPathStatus"), "INVALID_STATUS");
  const canonicalPath = nullableText(ownValue(record, "canonicalPath"), "INVALID_CANDIDATE", 2048);
  if (hasOwn(record, "historicalPathMappingStatus") && hasOwn(record, "historicalMappingStatus")) fail("INVALID_CANDIDATE");
  const historicalPathMappingStatus = status(
    hasOwn(record, "historicalPathMappingStatus")
      ? ownValue(record, "historicalPathMappingStatus")
      : ownValue(record, "historicalMappingStatus"),
    "INVALID_STATUS",
  );
  const pathRole = optionalString(record, "pathRole", "INVALID_CANDIDATE");
  if (exactPathStatus === "CONFIRMED" && !canonicalPath) fail("INVALID_CANDIDATE");
  if (exactPathStatus === "UNKNOWN" && canonicalPath !== null && pathRole !== "related_only" && pathRole !== "aggregate_related_only") fail("INVALID_CANDIDATE");
  return {
    rootAlias: safeText(ownValue(record, "rootAlias"), "INVALID_CANDIDATE", 256),
    canonicalPath,
    observedRelatedPath: optionalString(record, "observedRelatedPath", "INVALID_CANDIDATE"),
    pathRole,
    exactPathStatus,
    historicalPathMappingStatus,
    currentDirectoryReadability: status(ownValue(record, "currentDirectoryReadability"), "INVALID_STATUS"),
    currentShareRecordPathStatus: hasOwn(record, "currentShareRecordPathStatus")
      ? status(ownValue(record, "currentShareRecordPathStatus"), "INVALID_STATUS")
      : "UNKNOWN",
    lastEvidenceAt: safeText(ownValue(record, "lastEvidenceAt"), "INVALID_CANDIDATE"),
    evidenceRefs: evidenceRefs(ownValue(record, "evidenceRefs")),
  };
};

const readLinkedItemIds = (value: unknown): readonly string[] => {
  const items = requireArray(value, "INVALID_COLLECTION", 32);
  const ids = items.map((item) => {
    const record = requireRecord(item, ["itemId", "normalizedTitle", "observedScopeStatus", "rightsScopeStatus"], ["itemId", "normalizedTitle", "observedScopeStatus", "rightsScopeStatus"], "INVALID_COLLECTION");
    const itemId = safeText(ownValue(record, "itemId"), "INVALID_COLLECTION", 128);
    safeText(ownValue(record, "normalizedTitle"), "INVALID_COLLECTION", 512);
    status(ownValue(record, "observedScopeStatus"), "INVALID_STATUS");
    status(ownValue(record, "rightsScopeStatus"), "INVALID_STATUS");
    return itemId;
  });
  if (new Set(ids).size !== ids.length) fail("INVALID_COLLECTION");
  return ids;
};

const readScope = (value: unknown, spec: CandidateSpec): ReviewCardScope => {
  const record = requireRecord(
    value,
    ["displayGranularity", "productDecisionStatus", "canonicalScopeCode", "currentScopeStatus", "completeness", "paginationTermination", "contentRead", "scopeNote"],
    ["displayGranularity", "productDecisionStatus", "canonicalScopeCode", "linkedItems", "visibleObservedCount", "visibleDirectSubdirectoryCount", "currentScopeStatus", "completeness", "paginationTermination", "contentRead", "excludeObservedCopyPaths", "scopeNote", "level", "parentCollectionPath"],
    "INVALID_CANDIDATE",
  );
  const linkedItems = hasOwn(record, "linkedItems") ? readLinkedItemIds(ownValue(record, "linkedItems")) : [];
  if (spec.recordId === "B01-BAIDU-COLLECTION") {
    if (linkedItems.length !== 4) fail("INVALID_COLLECTION");
  } else if (linkedItems.length !== 0) {
    fail("INVALID_ASSOCIATION");
  }
  const visibleObservedCount = hasOwn(record, "visibleObservedCount") ? nullableNonNegativeInteger(ownValue(record, "visibleObservedCount"), "INVALID_CANDIDATE") : null;
  const visibleDirectSubdirectoryCount = hasOwn(record, "visibleDirectSubdirectoryCount") ? nullableNonNegativeInteger(ownValue(record, "visibleDirectSubdirectoryCount"), "INVALID_CANDIDATE") : null;
  if (visibleObservedCount !== null && visibleDirectSubdirectoryCount !== null) fail("INVALID_CANDIDATE");
  const levelValue = optionalString(record, "level", "INVALID_CANDIDATE");
  if (levelValue !== null && levelValue !== "CET4" && levelValue !== "CET6") fail("INVALID_ASSOCIATION");
  const parentCollectionPath = optionalString(record, "parentCollectionPath", "INVALID_CANDIDATE");
  return {
    displayGranularity: safeText(ownValue(record, "displayGranularity"), "INVALID_CANDIDATE", 128),
    productDecisionStatus: productDecisionStatus(ownValue(record, "productDecisionStatus")),
    canonicalScopeCode: safeText(ownValue(record, "canonicalScopeCode"), "INVALID_CANDIDATE", 256),
    level: levelValue as "CET4" | "CET6" | null,
    parentCollectionPath,
    linkedItemIds: linkedItems,
    observedCount: visibleObservedCount ?? visibleDirectSubdirectoryCount,
    currentScopeStatus: status(ownValue(record, "currentScopeStatus"), "INVALID_STATUS"),
    completeness: status(ownValue(record, "completeness"), "INVALID_STATUS"),
    paginationTermination: status(ownValue(record, "paginationTermination"), "INVALID_STATUS"),
    contentRead: bool(ownValue(record, "contentRead"), "INVALID_CANDIDATE"),
    scopeNote: safeText(ownValue(record, "scopeNote"), "INVALID_CANDIDATE"),
  };
};

const readHistoricalMapping = (value: unknown): ReviewCardHistoricalMapping => {
  const record = requireRecord(
    value,
    ["status"],
    ["status", "exactPathRecordCount", "parentCoverageObserved", "parentCollectionCoverageObserved", "historicalCreatedAt", "rawStatusValue", "rawStatusMeaning", "evidenceRefs", "recordCount", "reason"],
    "INVALID_CANDIDATE",
  );
  const recordCountValue = hasOwn(record, "exactPathRecordCount") ? ownValue(record, "exactPathRecordCount") : ownValue(record, "recordCount");
  const parentCoverageValue = hasOwn(record, "parentCoverageObserved")
    ? ownValue(record, "parentCoverageObserved")
    : hasOwn(record, "parentCollectionCoverageObserved")
      ? ownValue(record, "parentCollectionCoverageObserved")
      : undefined;
  const historicalCreatedAt = hasOwn(record, "historicalCreatedAt") ? safeStringArray(ownValue(record, "historicalCreatedAt"), "INVALID_CANDIDATE") : [];
  return {
    status: status(ownValue(record, "status"), "INVALID_STATUS"),
    recordCount: recordCountValue === undefined ? null : nullableNonNegativeInteger(recordCountValue, "INVALID_CANDIDATE"),
    parentCoverageObserved: parentCoverageValue === undefined ? null : bool(parentCoverageValue, "INVALID_CANDIDATE"),
    historicalCreatedAt,
    rawStatusValue: optionalString(record, "rawStatusValue", "INVALID_CANDIDATE"),
    rawStatusMeaning: optionalString(record, "rawStatusMeaning", "INVALID_CANDIDATE"),
    evidenceRefs: hasOwn(record, "evidenceRefs") ? evidenceRefs(ownValue(record, "evidenceRefs")) : [],
    reason: optionalString(record, "reason", "INVALID_CANDIDATE"),
  };
};

const readCurrentShareStatus = (value: unknown): ReviewCardCurrentShareStatus => {
  const record = requireRecord(value, ["status", "evidenceAt", "reason"], ["status", "evidenceAt", "pagesRead", "candidateNameMatches", "continuationObserved", "reason"], "INVALID_CANDIDATE");
  return {
    status: status(ownValue(record, "status"), "INVALID_STATUS"),
    evidenceAt: safeText(ownValue(record, "evidenceAt"), "INVALID_CANDIDATE"),
    pagesRead: hasOwn(record, "pagesRead") ? nullableNonNegativeInteger(ownValue(record, "pagesRead"), "INVALID_CANDIDATE") : null,
    candidateNameMatches: hasOwn(record, "candidateNameMatches") ? nullableNonNegativeInteger(ownValue(record, "candidateNameMatches"), "INVALID_CANDIDATE") : null,
    continuationObserved: hasOwn(record, "continuationObserved") ? (ownValue(record, "continuationObserved") === null ? null : bool(ownValue(record, "continuationObserved"), "INVALID_CANDIDATE")) : null,
    reason: safeText(ownValue(record, "reason"), "INVALID_CANDIDATE"),
  };
};

const readDirectoryMarker = (value: unknown): ReviewCardDirectoryMarker => {
  const record = requireRecord(value, ["status", "meaning"], ["status", "meaning"], "INVALID_CANDIDATE");
  const markerStatus = ownValue(record, "status");
  if (markerStatus !== "NOT OBSERVED" && !EVIDENCE_STATUSES.includes(markerStatus as EvidenceStatus)) fail("INVALID_STATUS");
  return {
    status: markerStatus as ReviewCardDirectoryMarker["status"],
    meaning: safeText(ownValue(record, "meaning"), "INVALID_CANDIDATE"),
  };
};

const readAnonymousAccess = (value: unknown): ReviewCardAnonymousAccess => {
  const record = requireRecord(value, ["status", "requiredByCurrentTask", "reason"], ["status", "requiredByCurrentTask", "reason"], "INVALID_CANDIDATE");
  return {
    status: status(ownValue(record, "status"), "INVALID_STATUS"),
    requiredByCurrentTask: bool(ownValue(record, "requiredByCurrentTask"), "INVALID_CANDIDATE"),
    reason: safeText(ownValue(record, "reason"), "INVALID_CANDIDATE"),
  };
};

const readShareEvidence = (value: unknown): ReviewCardShareEvidence => {
  const record = requireRecord(value, ["historicalMapping", "currentShareStatus", "directoryMarker", "anonymousAccess"], ["historicalMapping", "currentShareStatus", "directoryMarker", "anonymousAccess"], "INVALID_CANDIDATE");
  return {
    historicalMapping: readHistoricalMapping(ownValue(record, "historicalMapping")),
    currentShareStatus: readCurrentShareStatus(ownValue(record, "currentShareStatus")),
    directoryMarker: readDirectoryMarker(ownValue(record, "directoryMarker")),
    anonymousAccess: readAnonymousAccess(ownValue(record, "anonymousAccess")),
  };
};

const readOverlap = (value: unknown): ReviewCardOverlapAndDuplicates => {
  const record = requireRecord(value, ["parentChildOverlapRisk", "observedGroups", "duplicateCheck"], ["parentChildOverlapRisk", "observedGroups", "duplicateCheck"], "INVALID_CANDIDATE");
  const risk = ownValue(record, "parentChildOverlapRisk");
  if (typeof risk !== "string" || !OVERLAP_RISKS.includes(risk as (typeof OVERLAP_RISKS)[number])) fail("INVALID_STATUS");
  const duplicateRecord = requireRecord(ownValue(record, "duplicateCheck"), ["status", "decision", "canonicalCardCount", "reason"], ["status", "decision", "canonicalCardCount", "reason"], "INVALID_CANDIDATE");
  const duplicateCheck: ReviewCardDuplicateCheck = {
    status: duplicateStatus(ownValue(duplicateRecord, "status")),
    decision: safeText(ownValue(duplicateRecord, "decision"), "INVALID_CANDIDATE"),
    canonicalCardCount: nonNegativeInteger(ownValue(duplicateRecord, "canonicalCardCount"), "INVALID_CANDIDATE"),
    reason: safeText(ownValue(duplicateRecord, "reason"), "INVALID_CANDIDATE"),
  };
  return {
    parentChildOverlapRisk: risk as ReviewCardOverlapAndDuplicates["parentChildOverlapRisk"],
    observedGroups: safeStringArray(ownValue(record, "observedGroups"), "INVALID_CANDIDATE"),
    duplicateCheck,
  };
};

const readCorrespondence = (value: unknown, spec: CandidateSpec): ReviewCardCorrespondence | null => {
  if (spec.correspondence === null) {
    if (value !== undefined && value !== null) fail("INVALID_ASSOCIATION");
    return null;
  }
  const record = requireRecord(value, ["baseCandidateRecordId", "status", "requiredEvidence"], ["baseCandidateRecordId", "status", "requiredEvidence"], "INVALID_ASSOCIATION");
  const baseCandidateRecordId = safeText(ownValue(record, "baseCandidateRecordId"), "INVALID_ASSOCIATION", 128);
  if (baseCandidateRecordId !== spec.correspondence) fail("INVALID_ASSOCIATION");
  const correspondenceStatus = status(ownValue(record, "status"), "INVALID_STATUS");
  const result: ReviewCardCorrespondence = {
    baseCandidateRecordId,
    status: correspondenceStatus,
    requiredEvidence: safeStringArray(ownValue(record, "requiredEvidence"), "INVALID_ASSOCIATION"),
  };
  return result;
};

const readReadinessGate = (value: unknown): ReviewCardReadinessGate => {
  const keys = ["exactIdentity", "exactPath", "scopeComplete", "currentShareResolved", "sourceAndRightsEstablished", "publicLicenseCoversExactScope", "redistributionLicenseCoversExactScope", "anonymousAccessSatisfied", "duplicateDecisionComplete", "redactionCheckPass", "readyForReview"] as const;
  const record = requireRecord(value, keys, [...keys, "note"], "INCONSISTENT_READINESS");
  const result = Object.fromEntries(keys.map((key) => [key, bool(ownValue(record, key), "INCONSISTENT_READINESS")])) as ReviewCardReadinessGate;
  return result;
};

const readHumanReview = (value: unknown): ReviewCardHumanReview => {
  const record = requireRecord(value, ["decision", "reviewer", "reviewedAt", "finalImportApproval"], ["decision", "reviewer", "reviewedAt", "finalImportApproval"], "INVALID_CANDIDATE");
  const result = {
    decision: humanDecision(ownValue(record, "decision")),
    reviewer: nullableText(ownValue(record, "reviewer"), "INVALID_CANDIDATE"),
    reviewedAt: nullableText(ownValue(record, "reviewedAt"), "INVALID_CANDIDATE"),
    finalImportApproval: bool(ownValue(record, "finalImportApproval"), "INVALID_CANDIDATE"),
  } satisfies ReviewCardHumanReview;
  if (result.finalImportApproval) fail("INCONSISTENT_READINESS");
  return result;
};

const readProductDecisions = (value: unknown): void => {
  const record = requireRecord(value, ["B-01", "B-02", "quark"], ["B-01", "B-02", "quark"], "INVALID_PRODUCT_DECISION");
  const b01 = requireRecord(ownValue(record, "B-01"), ["displayGranularity", "decisionStatus", "linkedItemCount", "rule"], ["displayGranularity", "decisionStatus", "linkedItemCount", "rule"], "INVALID_PRODUCT_DECISION");
  if (ownValue(b01, "displayGranularity") !== "one_collection" || ownValue(b01, "decisionStatus") !== "CONFIRMED" || ownValue(b01, "linkedItemCount") !== 4) fail("INVALID_PRODUCT_DECISION");
  safeText(ownValue(b01, "rule"), "INVALID_PRODUCT_DECISION");
  const b02 = requireRecord(ownValue(record, "B-02"), ["displayGranularity", "decisionStatus", "candidateRecordIds", "rule"], ["displayGranularity", "decisionStatus", "candidateRecordIds", "rule"], "INVALID_PRODUCT_DECISION");
  if (ownValue(b02, "displayGranularity") !== "two_independent_level_entries" || ownValue(b02, "decisionStatus") !== "CONFIRMED") fail("INVALID_PRODUCT_DECISION");
  if (JSON.stringify(safeStringArray(ownValue(b02, "candidateRecordIds"), "INVALID_PRODUCT_DECISION")) !== JSON.stringify(["B02-CET4-BAIDU", "B02-CET6-BAIDU"])) fail("INVALID_PRODUCT_DECISION");
  safeText(ownValue(b02, "rule"), "INVALID_PRODUCT_DECISION");
  const quark = requireRecord(ownValue(record, "quark"), ["displayGranularity", "decisionStatus", "rule"], ["displayGranularity", "decisionStatus", "rule"], "INVALID_PRODUCT_DECISION");
  if (ownValue(quark, "displayGranularity") !== "independent_platform_records" || ownValue(quark, "decisionStatus") !== "CONFIRMED") fail("INVALID_PRODUCT_DECISION");
  safeText(ownValue(quark, "rule"), "INVALID_PRODUCT_DECISION");
};

const readStatusLegend = (value: unknown): void => {
  const record = requireRecord(value, ["candidateReviewStatus", "evidenceStatus"], ["candidateReviewStatus", "evidenceStatus"], "INVALID_ROOT");
  const readPart = (valuePart: unknown, expected: readonly string[]) => {
    const part = requireRecord(valuePart, [], [...expected, "enum", "definitions"], "INVALID_ROOT");
    if (hasOwn(part, "enum")) {
      const values = safeStringArray(ownValue(part, "enum"), "INVALID_ROOT");
      for (const item of expected) if (!values.includes(item)) fail("INVALID_ROOT");
      return;
    }
    for (const item of expected) safeText(ownValue(part, item), "INVALID_ROOT");
  };
  readPart(ownValue(record, "candidateReviewStatus"), REVIEW_STATUSES);
  readPart(ownValue(record, "evidenceStatus"), EVIDENCE_STATUSES);
};

const readControlRecords = (value: unknown) => {
  const records = requireArray(value, "INVALID_CONTROL_RECORD", 32);
  const ids = new Set<string>();
  const result: CandidateReviewDraftConversion["controlRecords"] = records.map((item) => {
    const record = requireRecord(item, ["recordId", "recordType", "platform", "path", "historicalApproval", "inheritanceAllowed", "use"], ["recordId", "recordType", "platform", "path", "historicalApproval", "inheritanceAllowed", "use"], "INVALID_CONTROL_RECORD");
    const recordId = safeText(ownValue(record, "recordId"), "INVALID_CONTROL_RECORD", 128);
    if (ids.has(recordId)) fail("INVALID_CONTROL_RECORD");
    ids.add(recordId);
    if (ownValue(record, "recordType") !== "non_candidate_parent_control" || ownValue(record, "platform") !== "quark" || ownValue(record, "inheritanceAllowed") !== false) fail("INVALID_CONTROL_RECORD");
    const path = requireRecord(ownValue(record, "path"), ["rootAlias", "observedPath", "exactCurrentPathStatus"], ["rootAlias", "observedPath", "exactCurrentPathStatus"], "INVALID_CONTROL_RECORD");
    safeText(ownValue(path, "rootAlias"), "INVALID_CONTROL_RECORD");
    safeText(ownValue(path, "observedPath"), "INVALID_CONTROL_RECORD");
    status(ownValue(path, "exactCurrentPathStatus"), "INVALID_STATUS");
    const approval = requireRecord(ownValue(record, "historicalApproval"), ["status", "scope", "doesNotProve"], ["status", "scope", "doesNotProve"], "INVALID_CONTROL_RECORD");
    safeText(ownValue(approval, "status"), "INVALID_CONTROL_RECORD", 128);
    safeText(ownValue(approval, "scope"), "INVALID_CONTROL_RECORD");
    safeStringArray(ownValue(approval, "doesNotProve"), "INVALID_CONTROL_RECORD");
    safeText(ownValue(record, "use"), "INVALID_CONTROL_RECORD");
    return { recordId, recordType: "non_candidate_parent_control", platform: "quark", inheritanceAllowed: false, usedByCandidateIds: [] as const };
  });
  if (!ids.has("Q-PARENT-UNIVERSITY-001")) fail("INVALID_CONTROL_RECORD");
  return result;
};

const readCandidate = (value: unknown, spec: CandidateSpec): ReviewCardDraft => {
  const record = requireRecord(
    value,
    ["recordId", "candidateGroup", "candidateKind", "platform", "title", "path", "scope", "sourceAndRights", "shareEvidence", "overlapAndDuplicates", "reviewStatus", "blockers", "readinessGate", "evidenceRefs", "humanReview"],
    ["recordId", "candidateGroup", "candidateKind", "platform", "title", "path", "scope", "sourceAndRights", "shareEvidence", "overlapAndDuplicates", "correspondence", "reviewStatus", "blockers", "readinessGate", "evidenceRefs", "humanReview"],
    "INVALID_CANDIDATE",
  );
  if (ownValue(record, "recordId") !== spec.recordId || ownValue(record, "candidateGroup") !== spec.candidateGroup || ownValue(record, "candidateKind") !== spec.candidateKind || ownValue(record, "platform") !== spec.platform) fail("INVALID_ASSOCIATION");
  const title = safeText(ownValue(record, "title"), "INVALID_CANDIDATE", 240);
  const path = readPath(ownValue(record, "path"));
  const scope = readScope(ownValue(record, "scope"), spec);
  if (spec.platform === "quark") {
    if (scope.productDecisionStatus !== "CONFIRMED_FOR_INDEPENDENT_RECORD_ONLY") fail("INVALID_PRODUCT_DECISION");
  } else if (scope.productDecisionStatus !== "CONFIRMED") {
    fail("INVALID_PRODUCT_DECISION");
  }
  const rights = readRights(ownValue(record, "sourceAndRights"));
  const shareEvidence = readShareEvidence(ownValue(record, "shareEvidence"));
  const overlapAndDuplicates = readOverlap(ownValue(record, "overlapAndDuplicates"));
  const correspondence = readCorrespondence(hasOwn(record, "correspondence") ? ownValue(record, "correspondence") : undefined, spec);
  if (spec.platform === "quark" && correspondence?.status === "CONFIRMED" && (path.exactPathStatus !== "CONFIRMED" || scope.currentScopeStatus !== "CONFIRMED" || scope.completeness !== "CONFIRMED")) fail("INCONSISTENT_READINESS");
  const reviewStatusValue = reviewStatus(ownValue(record, "reviewStatus"));
  const blockers = safeStringArray(ownValue(record, "blockers"), "INVALID_CANDIDATE");
  const readinessGate = readReadinessGate(ownValue(record, "readinessGate"));
  const humanReview = readHumanReview(ownValue(record, "humanReview"));
  const refs = evidenceRefs(ownValue(record, "evidenceRefs"));
  if (reviewStatusValue === "BLOCKED" && blockers.length === 0) fail("INCONSISTENT_READINESS");
  if (reviewStatusValue === "HOLD" && blockers.length > 0) fail("INCONSISTENT_READINESS");
  if (readinessGate.readyForReview !== (reviewStatusValue === "READY_FOR_REVIEW")) fail("INCONSISTENT_READINESS");
  if (reviewStatusValue === "READY_FOR_REVIEW") {
    const requiredGateKeys: readonly (keyof ReviewCardReadinessGate)[] = ["exactIdentity", "exactPath", "scopeComplete", "currentShareResolved", "sourceAndRightsEstablished", "publicLicenseCoversExactScope", "redistributionLicenseCoversExactScope", "anonymousAccessSatisfied", "duplicateDecisionComplete", "redactionCheckPass"];
    const requiredEvidenceStatuses: readonly EvidenceStatus[] = [
      path.exactPathStatus,
      path.historicalPathMappingStatus,
      path.currentDirectoryReadability,
      path.currentShareRecordPathStatus,
      scope.currentScopeStatus,
      scope.completeness,
      scope.paginationTermination,
      rights.acquisitionSource.status,
      rights.rightsHolder.status,
      shareEvidence.currentShareStatus.status,
    ];
    if (
      blockers.length > 0
      || humanReview.decision !== "PENDING"
      || requiredGateKeys.some((key) => !readinessGate[key])
      || requiredEvidenceStatuses.some((item) => item !== "CONFIRMED")
      || rights.writtenPublicLicense.status !== "CONFIRMED"
      || rights.redistributionLicense.status !== "CONFIRMED"
      || shareEvidence.anonymousAccess.status !== "CONFIRMED"
      || overlapAndDuplicates.duplicateCheck.status !== "PASS"
      || (spec.platform === "quark" && correspondence?.status !== "CONFIRMED")
    ) fail("INCONSISTENT_READINESS");
  }
  const card: Candidate = {
    name: title,
    fileType: "other",
    sizeBytes: null,
    categoryId: null,
    sourceLabel: spec.platform === "baidu" ? "百度网盘" : "夸克网盘",
    note: null,
  };
  return {
    schemaVersion: REVIEW_CARD_SCHEMA_VERSION,
    inputRound: "R17-29B",
    dataClassification: "sensitive-in-memory",
    candidateId: spec.recordId,
    candidateGroup: spec.candidateGroup,
    candidateKind: spec.candidateKind,
    platform: spec.platform,
    title,
    displayGranularity: scope.displayGranularity,
    path,
    scope,
    relatedItemIds: scope.linkedItemIds,
    rights,
    shareEvidence,
    overlapAndDuplicates,
    correspondence,
    reviewStatus: reviewStatusValue,
    blockers,
    readinessGate,
    pendingItems: [],
    humanReview,
    evidenceRefs: refs,
    card,
    publication: {
      canPublish: false,
      importApproved: false,
      publicationApproved: false,
      formalManifestWrite: false,
      reasonCodes: [],
    },
  };
};

const toCode = (value: string) => value.replace(/[^A-Za-z0-9]+/gu, "_").replace(/^_|_$/gu, "").toUpperCase();

const addPending = (items: ReviewCardPendingItem[], item: ReviewCardPendingItem) => {
  if (!items.some((existing) => existing.code === item.code)) items.push(item);
};

const finalizeCard = (card: ReviewCardDraft): ReviewCardDraft => {
  const pending: ReviewCardPendingItem[] = [];
  for (const blocker of card.blockers) addPending(pending, { code: blocker, reason: "Input blocker remains active.", source: "blocker" });
  for (const [key, value] of Object.entries(card.readinessGate)) {
    if (key !== "readyForReview" && value === false) addPending(pending, { code: `GATE_${toCode(key)}`, reason: `Readiness gate ${key} is false.`, source: "readiness_gate" });
  }
  const evidenceEntries: readonly (readonly [string, EvidenceStatus])[] = [
    ["EXACT_PATH", card.path.exactPathStatus],
    ["DIRECTORY_READABILITY", card.path.currentDirectoryReadability],
    ["SCOPE", card.scope.currentScopeStatus],
    ["SCOPE_COMPLETENESS", card.scope.completeness],
    ["PAGINATION", card.scope.paginationTermination],
    ["CURRENT_SHARE", card.shareEvidence.currentShareStatus.status],
    ["ANONYMOUS_ACCESS", card.shareEvidence.anonymousAccess.status],
    ["PUBLIC_LICENSE", card.rights.writtenPublicLicense.status],
    ["REDISTRIBUTION_LICENSE", card.rights.redistributionLicense.status],
    ...(card.correspondence ? [["CORRESPONDENCE", card.correspondence.status] as const] : []),
  ];
  for (const [name, value] of evidenceEntries) {
    if (value !== "CONFIRMED") addPending(pending, { code: `EVIDENCE_${name}_${toCode(value)}`, reason: `${name} remains ${value}.`, source: "evidence" });
  }
  if (card.overlapAndDuplicates.duplicateCheck.status !== "PASS") addPending(pending, { code: `DUPLICATE_${toCode(card.overlapAndDuplicates.duplicateCheck.status)}`, reason: "Duplicate or parent-child review is not complete.", source: "duplicate" });
  const reasonCodes = [...pending.map((item) => item.code), "MANUAL_APPROVAL_REQUIRED"];
  return {
    ...card,
    pendingItems: pending,
    publication: {
      canPublish: false,
      importApproved: false,
      publicationApproved: false,
      formalManifestWrite: false,
      reasonCodes: [...new Set(reasonCodes)],
    },
  };
};

const validateRoot = (input: unknown): SafeRecord => {
  const root = requireRecord(
    input,
    ["schemaVersion", "round", "documentType", "purpose", "formalManifestWrite", "cloudOperationsInThisRound", "productDecisions", "sourceReview", "statusLegend", "candidates", "controlRecords", "globalReviewState", "redactionCheck", "stopConditions"],
    ["schemaVersion", "round", "documentType", "purpose", "formalManifestWrite", "cloudOperationsInThisRound", "productDecisions", "sourceReview", "statusLegend", "candidates", "controlRecords", "globalReviewState", "redactionCheck", "stopConditions"],
    "INVALID_ROOT",
  );
  if (ownValue(root, "schemaVersion") !== 1 || ownValue(root, "round") !== "R17-29B" || ownValue(root, "documentType") !== "local_candidate_review_draft") fail("UNSUPPORTED_SCHEMA");
  safeText(ownValue(root, "purpose"), "INVALID_ROOT");
  if (ownValue(root, "formalManifestWrite") !== false || ownValue(root, "cloudOperationsInThisRound") !== 0) fail("INVALID_ROOT");
  requireArray(ownValue(root, "stopConditions"), "INVALID_ROOT").forEach((item) => safeText(item, "INVALID_ROOT"));
  readProductDecisions(ownValue(root, "productDecisions"));
  readStatusLegend(ownValue(root, "statusLegend"));
  const redaction = requireRecord(ownValue(root, "redactionCheck"), ["completeShareUrlsIncluded", "passcodesIncluded", "cookiesTokensCredentialsIncluded", "internalCloudIdentifiersIncluded", "documentBodiesIncluded"], ["completeShareUrlsIncluded", "passcodesIncluded", "cookiesTokensCredentialsIncluded", "internalCloudIdentifiersIncluded", "documentBodiesIncluded"], "SENSITIVE_INPUT");
  for (const key of ["completeShareUrlsIncluded", "passcodesIncluded", "cookiesTokensCredentialsIncluded", "internalCloudIdentifiersIncluded", "documentBodiesIncluded"]) if (ownValue(redaction, key) !== false) fail("SENSITIVE_INPUT");
  const global = requireRecord(ownValue(root, "globalReviewState"), ["canonicalCandidateCount", "candidateStatusCounts", "currentShareStatus", "anonymousAccess", "publicLicense", "redistributionLicense", "formalImport", "reason"], ["canonicalCandidateCount", "candidateStatusCounts", "currentShareStatus", "anonymousAccess", "publicLicense", "redistributionLicense", "formalImport", "reason"], "INVALID_ROOT");
  if (ownValue(global, "canonicalCandidateCount") !== 6 || ownValue(global, "formalImport") !== "BLOCKED") fail("INVALID_ROOT");
  status(ownValue(global, "currentShareStatus"), "INVALID_STATUS");
  status(ownValue(global, "anonymousAccess"), "INVALID_STATUS");
  status(ownValue(global, "publicLicense"), "INVALID_STATUS");
  status(ownValue(global, "redistributionLicense"), "INVALID_STATUS");
  safeText(ownValue(global, "reason"), "INVALID_ROOT");
  return root;
};

export function convertCandidateReviewDraft(input: unknown): CandidateReviewConversionResult {
  try {
    const safety = inspectSafety(input);
    if (safety === "sensitive") return reject("SENSITIVE_INPUT");
    if (safety !== "safe") return reject("INVALID_INPUT");
    const root = validateRoot(input);
    const controls = readControlRecords(ownValue(root, "controlRecords"));
    const candidateValues = requireArray(ownValue(root, "candidates"), "INVALID_CANDIDATE_SET", CANDIDATE_SPECS.length);
    if (candidateValues.length !== CANDIDATE_SPECS.length) return reject("INVALID_CANDIDATE_SET");
    const byId = new Map<string, unknown>();
    for (const candidate of candidateValues) {
      if (!isPlainRecord(candidate)) return reject("INVALID_CANDIDATE");
      const idValue = ownValue(candidate, "recordId");
      if (typeof idValue !== "string" || byId.has(idValue)) return reject("INVALID_CANDIDATE_SET");
      byId.set(idValue, candidate);
    }
    if (CANDIDATE_IDS.some((id) => !byId.has(id))) return reject("INVALID_CANDIDATE_SET");
    const cards = CANDIDATE_SPECS.map((spec) => finalizeCard(readCandidate(byId.get(spec.recordId), spec)));
    const pendingCandidateIds = cards.filter((card) => card.reviewStatus !== "READY_FOR_REVIEW").map((card) => card.candidateId);
    const value: CandidateReviewDraftConversion = {
      schemaVersion: REVIEW_CARD_SCHEMA_VERSION,
      inputRound: "R17-29B",
      dataClassification: "sensitive-in-memory",
      formalManifestWrite: false,
      cloudOperationsInThisRound: 0,
      cards,
      controlRecords: controls,
      candidateCount: 6,
      pendingCandidateIds,
    };
    return { status: "accepted", dataClassification: "sensitive-in-memory", value };
  } catch (error) {
    return error instanceof ConversionFailure ? reject(error.code) : reject("INVALID_INPUT");
  }
}
