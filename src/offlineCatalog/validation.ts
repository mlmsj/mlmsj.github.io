import { identityKeyForFile } from "./normalize";
import type { CatalogResourceDraft, ScanBatch, Snapshot } from "./types";

export type ValidationIssue = {
  code: string;
  identityRef?: string;
};

const isIsoDate = (value: string | null | undefined) =>
  value == null || (!Number.isNaN(Date.parse(value)) && new Date(value).toISOString() === value);

export const validateScanBatch = (batch: ScanBatch): readonly ValidationIssue[] => {
  const issues: ValidationIssue[] = [];
  if (!batch.scanBatchId.trim()) issues.push({ code: "missing-scan-batch-id" });
  if (!batch.scopeLocator.trim()) issues.push({ code: "missing-scope-locator" });
  if (!batch.permissionScopeFingerprint.trim()) issues.push({ code: "missing-permission-fingerprint" });
  if (batch.pagesRead < 0 || batch.itemsRead < 0) issues.push({ code: "negative-scan-count" });
  if (!isIsoDate(batch.startedAt) || !isIsoDate(batch.completedAt)) issues.push({ code: "invalid-scan-time" });
  const truncated = batch.stopReason === "max_pages" || batch.stopReason === "max_items";
  const canBeComplete =
    batch.status === "complete" &&
    batch.stopReason === "completed" &&
    batch.paginationComplete &&
    !truncated;
  if (batch.scopeComplete !== canBeComplete) issues.push({ code: "invalid-scope-completeness" });
  return issues;
};

export const validateSnapshot = (snapshot: Snapshot): readonly ValidationIssue[] => {
  const issues = [...validateScanBatch(snapshot.batch)];
  const seen = new Set<string>();
  for (const file of snapshot.files) {
    const identityRef = identityKeyForFile(file);
    if (!file.providerFileId.trim()) issues.push({ code: "missing-provider-file-id", identityRef });
    if (!file.name.trim()) issues.push({ code: "missing-file-name", identityRef });
    if (file.provider !== snapshot.batch.provider) issues.push({ code: "provider-mismatch", identityRef });
    if (file.size != null && (!Number.isFinite(file.size) || file.size < 0)) {
      issues.push({ code: "invalid-size", identityRef });
    }
    if (file.createdAt.utcIso && !isIsoDate(file.createdAt.utcIso)) issues.push({ code: "invalid-created-time", identityRef });
    if (file.modifiedAt.utcIso && !isIsoDate(file.modifiedAt.utcIso)) issues.push({ code: "invalid-modified-time", identityRef });
    if (seen.has(identityRef)) issues.push({ code: "duplicate-identity", identityRef });
    seen.add(identityRef);
  }
  return issues;
};

export const validateCatalogDraft = (draft: CatalogResourceDraft): readonly ValidationIssue[] =>
  draft.publicationStatus === "draft" ? [] : [{ code: "draft-must-not-be-published" }];
