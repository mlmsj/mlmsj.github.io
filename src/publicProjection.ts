import { categories, getEnabledCategoryPath, type Category } from "./categories";
import {
  evaluateDeliveryShareLinkGate,
  evaluateResourceMetadataGate,
  projectLegacyManifestRecordToV2,
  type AuthorizationContext,
  type AuthorizationEvidence,
  type BrowseState,
  type PublicGateIssueCode,
} from "./catalogV2";
import {
  PUBLIC_MANIFEST_SCHEMA_VERSION,
  type PublicManifest,
  type PublicManifestRecord,
} from "./publicManifest";

/**
 * Build-time only authorization binding. It is deliberately not part of the
 * public manifest shape and is never serialized into the public JSON.
 */
export type PublicProjectionPolicy = {
  deliveryId: string;
  browseState: BrowseState;
  evidence: readonly AuthorizationEvidence[];
};

export type PublicProjectionDecision = {
  resourceId: string;
  deliveryId: string | null;
  metadataExposed: boolean;
  shareLinkExposed: boolean;
  metadataIssues: readonly PublicGateIssueCode[];
  shareLinkIssues: readonly PublicGateIssueCode[];
};

export type PublicManifestProjection = {
  manifest: PublicManifest;
  decisions: readonly PublicProjectionDecision[];
};

const policyFor = (
  policies: ReadonlyMap<string, PublicProjectionPolicy> | Readonly<Record<string, PublicProjectionPolicy>>,
  resourceId: string,
) => {
  if (policies instanceof Map) return policies.get(resourceId);
  return (policies as Readonly<Record<string, PublicProjectionPolicy>>)[resourceId];
};

const withoutShareEntry = (record: PublicManifestRecord): PublicManifestRecord => {
  const projected = { ...record, shareUrl: null };
  delete projected.passcode;
  return projected;
};

/**
 * Projects a validated legacy manifest through the v2 resource and delivery
 * authorization gates. Missing policy is intentionally fail-closed.
 */
export const projectManifestToPublic = (
  input: PublicManifest,
  policies: ReadonlyMap<string, PublicProjectionPolicy> | Readonly<Record<string, PublicProjectionPolicy>>,
  context: AuthorizationContext,
  categoryValues: readonly Category[] = categories,
): PublicManifestProjection => {
  const records: PublicManifestRecord[] = [];
  const decisions: PublicProjectionDecision[] = [];

  for (const record of input.records) {
    const policy = policyFor(policies, record.id);
    if (!policy) {
      decisions.push({
        resourceId: record.id,
        deliveryId: null,
        metadataExposed: false,
        shareLinkExposed: false,
        metadataIssues: ["resource-authorization-missing"],
        shareLinkIssues: ["resource-authorization-missing"],
      });
      continue;
    }

    const projection = projectLegacyManifestRecordToV2(record, {
      deliveryId: policy.deliveryId,
      browseState: policy.browseState,
    });
    const categoryIsPublic =
      getEnabledCategoryPath(record.categoryId, categoryValues).length > 0;
    const metadataGate = evaluateResourceMetadataGate(
      projection.resource,
      categoryIsPublic,
      context,
      policy.evidence,
    );

    if (!metadataGate.ok) {
      decisions.push({
        resourceId: record.id,
        deliveryId: policy.deliveryId,
        metadataExposed: false,
        shareLinkExposed: false,
        metadataIssues: metadataGate.issues,
        shareLinkIssues: metadataGate.issues,
      });
      continue;
    }

    const shareLinkGate = evaluateDeliveryShareLinkGate(
      projection.resource,
      projection.delivery,
      categoryIsPublic,
      context,
      policy.evidence,
    );
    const publicRecord = shareLinkGate.ok
      ? { ...record }
      : withoutShareEntry(record);
    records.push(publicRecord);
    decisions.push({
      resourceId: record.id,
      deliveryId: policy.deliveryId,
      metadataExposed: true,
      shareLinkExposed: shareLinkGate.ok,
      metadataIssues: [],
      shareLinkIssues: shareLinkGate.issues,
    });
  }

  return {
    manifest: {
      schemaVersion: PUBLIC_MANIFEST_SCHEMA_VERSION,
      generatedAt: input.generatedAt,
      records,
    },
    decisions,
  };
};
