import { identityKeyForFile, normalizeNameForMatching } from "./normalize";
import type { DuplicateCandidate, DuplicateInput } from "./types";

const pairKey = (left: string, right: string) =>
  left < right ? `${left}\u0000${right}` : `${right}\u0000${left}`;

const metadataCompatible = (left: DuplicateInput, right: DuplicateInput) =>
  (!left.year || !right.year || left.year === right.year) &&
  (!left.version || !right.version || left.version === right.version) &&
  (!left.region || !right.region || left.region === right.region);

export const findDuplicateCandidates = (
  values: readonly DuplicateInput[],
): readonly DuplicateCandidate[] => {
  const result = new Map<string, DuplicateCandidate>();
  const hashBuckets = new Map<string, DuplicateInput[]>();
  const weakBuckets = new Map<string, DuplicateInput[]>();

  for (const value of values) {
    const file = value.file;
    if (file.hash && file.hashAlgorithm) {
      const key = `${file.hashAlgorithm.toLocaleLowerCase()}\u0000${file.hash}`;
      hashBuckets.set(key, [...(hashBuckets.get(key) ?? []), value]);
    }
    if (file.size != null) {
      const key = `${file.size}\u0000${normalizeNameForMatching(file.name)}`;
      weakBuckets.set(key, [...(weakBuckets.get(key) ?? []), value]);
    }
  }

  const addPairs = (bucket: readonly DuplicateInput[], confidence: "high" | "low") => {
    for (let leftIndex = 0; leftIndex < bucket.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < bucket.length; rightIndex += 1) {
        const left = bucket[leftIndex];
        const right = bucket[rightIndex];
        const leftId = identityKeyForFile(left.file);
        const rightId = identityKeyForFile(right.file);
        if (leftId === rightId || !metadataCompatible(left, right)) continue;
        const key = pairKey(leftId, rightId);
        const existing = result.get(key);
        if (existing?.confidence === "high") continue;
        result.set(key, {
          leftIdentityRef: leftId < rightId ? leftId : rightId,
          rightIdentityRef: leftId < rightId ? rightId : leftId,
          confidence,
          reasonCode: confidence === "high" ? "same_comparable_hash" : "same_size_and_normalized_name",
          requiresReview: true,
        });
      }
    }
  };

  for (const bucket of hashBuckets.values()) addPairs(bucket, "high");
  for (const bucket of weakBuckets.values()) addPairs(bucket, "low");
  return [...result.values()].sort(
    (a, b) =>
      a.leftIdentityRef.localeCompare(b.leftIdentityRef) ||
      a.rightIdentityRef.localeCompare(b.rightIdentityRef),
  );
};
