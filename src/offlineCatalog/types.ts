export type Provider = "baidu" | "quark";

export type TimestampObservation = {
  utcIso: string | null;
  rawValue: string | number | null;
  rawFormat: string | null;
  conversionVersion: string;
};

export type ProviderFile = {
  provider: Provider;
  providerFileId: string;
  parentId?: string | null;
  pathHint?: string | null;
  name: string;
  fileType?: string | null;
  size?: number | null;
  hash?: string | null;
  hashAlgorithm?: string | null;
  createdAt: TimestampObservation;
  modifiedAt: TimestampObservation;
};

export type ScanStopReason =
  | "completed"
  | "max_pages"
  | "max_items"
  | "permission_changed"
  | "pagination_error"
  | "provider_error"
  | "cancelled";

export type ScanBatch = {
  scanBatchId: string;
  provider: Provider;
  scopeLocatorType: "provider_id" | "path";
  scopeLocator: string;
  recursive: boolean;
  startedAt: string;
  completedAt?: string | null;
  maxPages: number | null;
  maxItems: number | null;
  pagesRead: number;
  itemsRead: number;
  paginationComplete: boolean;
  stopReason: ScanStopReason;
  permissionScopeFingerprint: string;
  status: "complete" | "partial" | "failed";
  scopeComplete: boolean;
  toolVersion?: string | null;
};

export type Snapshot = {
  batch: ScanBatch;
  files: readonly ProviderFile[];
};

export type SnapshotChangeType =
  | "added"
  | "changed"
  | "renamed_or_moved"
  | "missing_candidate"
  | "restored"
  | "needs_review"
  | "unknown";

export type SnapshotDiff = {
  identityRef: string;
  previousScanBatchId: string | null;
  currentScanBatchId: string;
  changeType: SnapshotChangeType;
  changedFields: readonly string[];
  reasonCode: string;
  confidence: "high" | "medium" | "low" | "none";
  requiresReview: boolean;
};

export type CatalogResourceDraft = {
  draftId: string;
  title: string;
  categoryId: string | null;
  year?: string | null;
  region?: string | null;
  subject?: string | null;
  examType?: string | null;
  version?: string | null;
  description?: string | null;
  reviewStatus: "pending" | "approved" | "rejected" | "needs_info";
  copyrightStatus: "unknown" | "permitted" | "restricted" | "prohibited";
  publicationStatus: "draft";
};

export type ResourceSourceLink = {
  draftId: string;
  provider: Provider;
  providerFileId: string;
  relationType: "primary" | "mirror" | "alternate_version" | "candidate";
  confidence: "high" | "medium" | "low";
  reviewStatus: "pending" | "approved" | "rejected";
};

export type DuplicateInput = {
  file: ProviderFile;
  year?: string | null;
  version?: string | null;
  region?: string | null;
};

export type DuplicateCandidate = {
  leftIdentityRef: string;
  rightIdentityRef: string;
  confidence: "high" | "low";
  reasonCode: "same_comparable_hash" | "same_size_and_normalized_name";
  requiresReview: true;
};
