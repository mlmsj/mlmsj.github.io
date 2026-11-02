import { describe, expect, it } from "vitest";
import {
  projectManifestToPublic,
  type PublicProjectionPolicy,
} from "./publicProjection";
import type { AuthorizationEvidence } from "./catalogV2";
import type { PublicManifest } from "./publicManifest";

const context = {
  audience: "public",
  platform: "website",
  now: "2026-11-02T00:00:00+08:00",
} as const;

const source: PublicManifest = {
  schemaVersion: 1,
  generatedAt: "2026-11-01T00:00:00Z",
  records: [
    {
      id: "authorized-link",
      title: "已授权链接资料",
      categoryId: "type-junior-math-notes",
      provider: "quark",
      shareUrl: "https://pan.quark.cn/s/authorized-link",
      passcode: "0123",
      accessStatus: "verified",
      checkedOn: "2026-11-01",
      publishedAt: "2026-11-01T00:00:00Z",
    },
    {
      id: "metadata-only",
      title: "仅授权元数据资料",
      categoryId: "type-junior-math-notes",
      provider: "quark",
      shareUrl: "https://pan.quark.cn/s/metadata-only",
      passcode: "5678",
      accessStatus: "verified",
      checkedOn: "2026-11-01",
      publishedAt: "2026-11-01T00:00:00Z",
    },
    {
      id: "unauthorized",
      title: "未授权资料",
      categoryId: "type-junior-math-notes",
      provider: "quark",
      shareUrl: "https://pan.quark.cn/s/unauthorized",
      accessStatus: "verified",
      checkedOn: "2026-11-01",
      publishedAt: "2026-11-01T00:00:00Z",
    },
  ],
};

const resourceEvidence = (resourceId: string): AuthorizationEvidence => ({
  evidenceId: `resource:${resourceId}`,
  subjectType: "resource",
  resourceId,
  actionScope: ["display_metadata", "expose_share_link"],
  audienceScope: ["public"],
  platformScope: ["website"],
  status: "approved",
});

const linkEvidence = (
  resourceId: string,
  deliveryId: string,
): AuthorizationEvidence => ({
  evidenceId: `delivery:${resourceId}:${deliveryId}`,
  subjectType: "delivery",
  resourceId,
  deliveryId,
  actionScope: ["expose_share_link"],
  audienceScope: ["public"],
  platformScope: ["website"],
  status: "approved",
});

const policy = (
  deliveryId: string,
  evidence: readonly AuthorizationEvidence[],
): PublicProjectionPolicy => ({
  deliveryId,
  browseState: "observed",
  evidence,
});

describe("build-time public manifest projection", () => {
  it("keeps only metadata and links that pass the matching v2 gates", () => {
    const policies = new Map<string, PublicProjectionPolicy>([
      [
        "authorized-link",
        policy("delivery-a", [
          resourceEvidence("authorized-link"),
          linkEvidence("authorized-link", "delivery-a"),
        ]),
      ],
      [
        "metadata-only",
        policy("delivery-b", [
          {
            ...resourceEvidence("metadata-only"),
            actionScope: ["display_metadata"],
          },
        ]),
      ],
    ]);

    const result = projectManifestToPublic(source, policies, context);
    expect(result.manifest.records.map((record) => record.id)).toEqual([
      "authorized-link",
      "metadata-only",
    ]);
    expect(result.manifest.records[0]?.shareUrl).toBe(source.records[0]?.shareUrl);
    expect(result.manifest.records[0]?.passcode).toBe("0123");
    expect(result.manifest.records[1]?.shareUrl).toBeNull();
    expect(result.manifest.records[1]?.passcode).toBeUndefined();
    expect(result.decisions).toEqual([
      expect.objectContaining({
        resourceId: "authorized-link",
        metadataExposed: true,
        shareLinkExposed: true,
      }),
      expect.objectContaining({
        resourceId: "metadata-only",
        metadataExposed: true,
        shareLinkExposed: false,
      }),
      expect.objectContaining({
        resourceId: "unauthorized",
        metadataExposed: false,
        shareLinkExposed: false,
      }),
    ]);
    expect(JSON.stringify(result.manifest)).not.toContain("evidenceId");
    expect(JSON.stringify(result.manifest)).not.toContain("delivery-a");
  });

  it("does not let a different Delivery authorization expose the current link", () => {
    const result = projectManifestToPublic(
      { ...source, records: [source.records[0]!] },
      new Map([
        [
          "authorized-link",
          policy("delivery-a", [
            resourceEvidence("authorized-link"),
            linkEvidence("authorized-link", "delivery-b"),
          ]),
        ],
      ]),
      context,
    );
    expect(result.manifest.records).toHaveLength(1);
    expect(result.manifest.records[0]?.shareUrl).toBeNull();
    expect(result.manifest.records[0]?.passcode).toBeUndefined();
    expect(result.decisions[0]?.shareLinkExposed).toBe(false);
    expect(result.decisions[0]?.shareLinkIssues).toContain(
      "delivery-authorization-missing",
    );
  });
});
