import type { Candidate } from "../manualImport/types";
import type { Provider } from "../types";

export const REVIEW_CARD_SCHEMA_VERSION = "r17-32.review-card.v1" as const;

export type CandidateReviewStatus = "HOLD" | "BLOCKED" | "READY_FOR_REVIEW";
export type EvidenceStatus = "CONFIRMED" | "UNKNOWN" | "NOT RUN" | "BLOCKED";
export type ProductDecisionStatus = EvidenceStatus | "CONFIRMED_FOR_INDEPENDENT_RECORD_ONLY";
export type DuplicateCheckStatus = "PASS" | "UNRESOLVED" | "FAIL" | "NOT RUN";
export type ShareMarkerStatus = EvidenceStatus | "NOT OBSERVED";
export type HumanReviewDecision =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CHANGES_REQUESTED";

export type ReviewCardEvidence = {
  readonly status: EvidenceStatus;
  readonly value: string | null;
  readonly reason: string;
  readonly evidenceRefs: readonly string[];
};

export type ReviewCardLicense = {
  readonly status: EvidenceStatus;
  readonly coversExactScope: boolean;
  readonly evidenceRefs: readonly string[];
  readonly reason: string;
};

export type ReviewCardRedistributionLicense = ReviewCardLicense & {
  readonly audienceAndChannelConfirmed: boolean;
};

export type ReviewCardRights = {
  readonly acquisitionSource: ReviewCardEvidence;
  readonly rightsHolder: ReviewCardEvidence;
  readonly writtenPublicLicense: ReviewCardLicense;
  readonly redistributionLicense: ReviewCardRedistributionLicense;
};

export type ReviewCardPath = {
  readonly rootAlias: string;
  readonly canonicalPath: string | null;
  readonly observedRelatedPath: string | null;
  readonly pathRole: string | null;
  readonly exactPathStatus: EvidenceStatus;
  readonly historicalPathMappingStatus: EvidenceStatus;
  readonly currentDirectoryReadability: EvidenceStatus;
  readonly currentShareRecordPathStatus: EvidenceStatus;
  readonly lastEvidenceAt: string;
  readonly evidenceRefs: readonly string[];
};

export type ReviewCardScope = {
  readonly displayGranularity: string;
  readonly productDecisionStatus: ProductDecisionStatus;
  readonly canonicalScopeCode: string;
  readonly level: "CET4" | "CET6" | null;
  readonly parentCollectionPath: string | null;
  readonly linkedItemIds: readonly string[];
  readonly observedCount: number | null;
  readonly currentScopeStatus: EvidenceStatus;
  readonly completeness: EvidenceStatus;
  readonly paginationTermination: EvidenceStatus;
  readonly contentRead: boolean;
  readonly scopeNote: string;
};

export type ReviewCardHistoricalMapping = {
  readonly status: EvidenceStatus;
  readonly recordCount: number | null;
  readonly parentCoverageObserved: boolean | null;
  readonly historicalCreatedAt: readonly string[];
  readonly rawStatusValue: string | null;
  readonly rawStatusMeaning: string | null;
  readonly evidenceRefs: readonly string[];
  readonly reason: string | null;
};

export type ReviewCardCurrentShareStatus = {
  readonly status: EvidenceStatus;
  readonly evidenceAt: string;
  readonly pagesRead: number | null;
  readonly candidateNameMatches: number | null;
  readonly continuationObserved: boolean | null;
  readonly reason: string;
};

export type ReviewCardDirectoryMarker = {
  readonly status: ShareMarkerStatus;
  readonly meaning: string;
};

export type ReviewCardAnonymousAccess = {
  readonly status: EvidenceStatus;
  readonly requiredByCurrentTask: boolean;
  readonly reason: string;
};

export type ReviewCardShareEvidence = {
  readonly historicalMapping: ReviewCardHistoricalMapping;
  readonly currentShareStatus: ReviewCardCurrentShareStatus;
  readonly directoryMarker: ReviewCardDirectoryMarker;
  readonly anonymousAccess: ReviewCardAnonymousAccess;
};

export type ReviewCardDuplicateCheck = {
  readonly status: DuplicateCheckStatus;
  readonly decision: string;
  readonly canonicalCardCount: number;
  readonly reason: string;
};

export type ReviewCardOverlapAndDuplicates = {
  readonly parentChildOverlapRisk: "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN" | "NONE";
  readonly observedGroups: readonly string[];
  readonly duplicateCheck: ReviewCardDuplicateCheck;
};

export type ReviewCardCorrespondence = {
  readonly baseCandidateRecordId: string;
  readonly status: EvidenceStatus;
  readonly requiredEvidence: readonly string[];
};

export type ReviewCardReadinessGate = {
  readonly exactIdentity: boolean;
  readonly exactPath: boolean;
  readonly scopeComplete: boolean;
  readonly currentShareResolved: boolean;
  readonly sourceAndRightsEstablished: boolean;
  readonly publicLicenseCoversExactScope: boolean;
  readonly redistributionLicenseCoversExactScope: boolean;
  readonly anonymousAccessSatisfied: boolean;
  readonly duplicateDecisionComplete: boolean;
  readonly redactionCheckPass: boolean;
  readonly readyForReview: boolean;
};

export type ReviewCardHumanReview = {
  readonly decision: HumanReviewDecision;
  readonly reviewer: string | null;
  readonly reviewedAt: string | null;
  readonly finalImportApproval: boolean;
};

export type ReviewCardPendingItem = {
  readonly code: string;
  readonly reason: string;
  readonly source: "blocker" | "readiness_gate" | "evidence" | "duplicate";
};

export type ReviewCardPublicationGate = {
  readonly canPublish: false;
  readonly importApproved: false;
  readonly publicationApproved: false;
  readonly formalManifestWrite: false;
  readonly reasonCodes: readonly string[];
};

export type ReviewCardDraft = {
  readonly schemaVersion: typeof REVIEW_CARD_SCHEMA_VERSION;
  readonly inputRound: "R17-29B";
  readonly dataClassification: "sensitive-in-memory";
  readonly candidateId: string;
  readonly candidateGroup: "B-01" | "B-02";
  readonly candidateKind: string;
  readonly platform: Provider;
  readonly title: string;
  readonly displayGranularity: string;
  readonly path: ReviewCardPath;
  readonly scope: ReviewCardScope;
  readonly relatedItemIds: readonly string[];
  readonly rights: ReviewCardRights;
  readonly shareEvidence: ReviewCardShareEvidence;
  readonly overlapAndDuplicates: ReviewCardOverlapAndDuplicates;
  readonly correspondence: ReviewCardCorrespondence | null;
  readonly reviewStatus: CandidateReviewStatus;
  readonly blockers: readonly string[];
  readonly readinessGate: ReviewCardReadinessGate;
  readonly pendingItems: readonly ReviewCardPendingItem[];
  readonly humanReview: ReviewCardHumanReview;
  readonly evidenceRefs: readonly string[];
  readonly card: Candidate;
  readonly publication: ReviewCardPublicationGate;
};

export type ReviewCardControlRecord = {
  readonly recordId: string;
  readonly recordType: "non_candidate_parent_control";
  readonly platform: "quark";
  readonly inheritanceAllowed: false;
  readonly usedByCandidateIds: readonly [];
};

export type CandidateReviewDraftConversion = {
  readonly schemaVersion: typeof REVIEW_CARD_SCHEMA_VERSION;
  readonly inputRound: "R17-29B";
  readonly dataClassification: "sensitive-in-memory";
  readonly formalManifestWrite: false;
  readonly cloudOperationsInThisRound: 0;
  readonly cards: readonly ReviewCardDraft[];
  readonly controlRecords: readonly ReviewCardControlRecord[];
  readonly candidateCount: 6;
  readonly pendingCandidateIds: readonly string[];
};

export type CandidateReviewConversionErrorCode =
  | "INVALID_INPUT"
  | "INVALID_ROOT"
  | "UNSUPPORTED_SCHEMA"
  | "SENSITIVE_INPUT"
  | "INVALID_PRODUCT_DECISION"
  | "INVALID_CANDIDATE_SET"
  | "INVALID_CANDIDATE"
  | "INVALID_STATUS"
  | "INVALID_ASSOCIATION"
  | "INVALID_COLLECTION"
  | "INVALID_CONTROL_RECORD"
  | "INCONSISTENT_READINESS"
  | "OUTPUT_CONTRACT";

export type CandidateReviewConversionResult =
  | {
      readonly status: "accepted";
      readonly dataClassification: "sensitive-in-memory";
      readonly value: CandidateReviewDraftConversion;
    }
  | {
      readonly status: "rejected";
      readonly code: CandidateReviewConversionErrorCode;
      readonly summary: "Conversion rejected";
    };
