import { identityKeyForFile } from "./normalize";
import { validateSnapshot } from "./validation";
import type { ProviderFile, Snapshot, SnapshotDiff } from "./types";

export type DiffOptions = {
  previousMissingIdentityRefs?: ReadonlySet<string>;
};

const stable = (diffs: SnapshotDiff[]) =>
  diffs.sort(
    (a, b) =>
      a.identityRef.localeCompare(b.identityRef) ||
      a.changeType.localeCompare(b.changeType) ||
      a.reasonCode.localeCompare(b.reasonCode),
  );

const sameScope = (previous: Snapshot, current: Snapshot) =>
  previous.batch.provider === current.batch.provider &&
  previous.batch.scopeLocatorType === current.batch.scopeLocatorType &&
  previous.batch.scopeLocator === current.batch.scopeLocator &&
  previous.batch.recursive === current.batch.recursive &&
  previous.batch.permissionScopeFingerprint === current.batch.permissionScopeFingerprint;

const complete = (snapshot: Snapshot) =>
  snapshot.batch.status === "complete" &&
  snapshot.batch.paginationComplete &&
  snapshot.batch.scopeComplete &&
  snapshot.batch.stopReason === "completed";

const baseDiff = (
  file: ProviderFile,
  previous: Snapshot,
  current: Snapshot,
): Pick<SnapshotDiff, "identityRef" | "previousScanBatchId" | "currentScanBatchId"> => ({
  identityRef: identityKeyForFile(file),
  previousScanBatchId: previous.batch.scanBatchId,
  currentScanBatchId: current.batch.scanBatchId,
});

export const diffSnapshots = (
  previous: Snapshot,
  current: Snapshot,
  options: DiffOptions = {},
): readonly SnapshotDiff[] => {
  const invalid = [...validateSnapshot(previous), ...validateSnapshot(current)];
  const comparable = sameScope(previous, current);
  const previousMap = new Map(previous.files.map((file) => [identityKeyForFile(file), file]));
  const currentMap = new Map(current.files.map((file) => [identityKeyForFile(file), file]));
  const identities = [...new Set([...previousMap.keys(), ...currentMap.keys()])].sort();

  if (invalid.length > 0 || !comparable) {
    return identities.map((identityRef) => ({
      identityRef,
      previousScanBatchId: previous.batch.scanBatchId,
      currentScanBatchId: current.batch.scanBatchId,
      changeType: "unknown",
      changedFields: [],
      reasonCode: invalid.length > 0 ? "invalid-snapshot" : "incompatible-scope-or-permission",
      confidence: "none",
      requiresReview: true,
    }));
  }

  const diffs: SnapshotDiff[] = [];
  for (const identityRef of identities) {
    const before = previousMap.get(identityRef);
    const after = currentMap.get(identityRef);
    if (!before && after) {
      diffs.push({
        identityRef,
        previousScanBatchId: previous.batch.scanBatchId,
        currentScanBatchId: current.batch.scanBatchId,
        changeType: options.previousMissingIdentityRefs?.has(identityRef) ? "restored" : "added",
        changedFields: [],
        reasonCode: options.previousMissingIdentityRefs?.has(identityRef) ? "explicit-missing-history" : "new-identity",
        confidence: "high",
        requiresReview: true,
      });
      continue;
    }
    if (before && !after) {
      diffs.push({
        ...baseDiff(before, previous, current),
        changeType: complete(previous) && complete(current) ? "missing_candidate" : "unknown",
        changedFields: [],
        reasonCode: complete(previous) && complete(current) ? "absent-from-complete-comparable-scan" : "incomplete-scan",
        confidence: complete(previous) && complete(current) ? "medium" : "none",
        requiresReview: true,
      });
      continue;
    }
    if (!before || !after) continue;

    const locationFields = [
      before.name !== after.name ? "name" : null,
      before.parentId !== after.parentId ? "parentId" : null,
      before.pathHint !== after.pathHint ? "pathHint" : null,
    ].filter((field): field is string => field !== null);
    if (locationFields.length > 0) {
      diffs.push({
        ...baseDiff(after, previous, current),
        changeType: "renamed_or_moved",
        changedFields: locationFields,
        reasonCode: "location-metadata-changed",
        confidence: "high",
        requiresReview: true,
      });
    }

    const comparableHash =
      before.hash && after.hash && before.hashAlgorithm &&
      before.hashAlgorithm === after.hashAlgorithm;
    const contentFields = [
      comparableHash && before.hash !== after.hash ? "hash" : null,
      before.size != null && after.size != null && before.size !== after.size ? "size" : null,
    ].filter((field): field is string => field !== null);
    if (contentFields.length > 0) {
      diffs.push({
        ...baseDiff(after, previous, current),
        changeType: "changed",
        changedFields: contentFields,
        reasonCode: "reliable-content-evidence-changed",
        confidence: "high",
        requiresReview: true,
      });
    } else {
      const timeChanged = before.modifiedAt.utcIso !== after.modifiedAt.utcIso;
      const timeComparable =
        before.modifiedAt.utcIso != null &&
        after.modifiedAt.utcIso != null &&
        before.modifiedAt.conversionVersion === after.modifiedAt.conversionVersion &&
        before.modifiedAt.rawFormat === after.modifiedAt.rawFormat;
      const hashIncomparable =
        Boolean(before.hash || after.hash) &&
        (!before.hash || !after.hash || before.hashAlgorithm !== after.hashAlgorithm);
      if (timeChanged || hashIncomparable) {
        diffs.push({
          ...baseDiff(after, previous, current),
          changeType: "needs_review",
          changedFields: [timeChanged ? "modifiedAt" : "hash"],
          reasonCode: !timeComparable || hashIncomparable ? "incomparable-content-evidence" : "time-only-change",
          confidence: "low",
          requiresReview: true,
        });
      }
    }
  }
  return stable(diffs);
};
