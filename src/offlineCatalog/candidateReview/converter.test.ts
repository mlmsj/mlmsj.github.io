// @vitest-environment node

import { describe, expect, it } from "vitest";
import { convertCandidateReviewDraft } from "./converter";

type TestRecord = Record<string, unknown>;

const LOCAL_EVIDENCE = ["evidence/synthetic/R17-29B/evidence.md"];
const CANDIDATE_IDS = [
  "B01-BAIDU-COLLECTION",
  "B02-CET4-BAIDU",
  "B02-CET6-BAIDU",
  "Q-B01-UNMAPPED",
  "Q-B02-CET4-UNMAPPED",
  "Q-B02-CET6-UNMAPPED",
] as const;

const asRecord = (value: unknown): TestRecord => value as TestRecord;
const asArray = (value: unknown): unknown[] => value as unknown[];
const localEvidence = (): string[] => [...LOCAL_EVIDENCE];

const evidence = (status: string, reason: string): TestRecord => ({
  status,
  value: null,
  reason,
  evidenceRefs: localEvidence(),
});

const collectionItems = (): TestRecord[] =>
  ["P01", "P02", "P03", "P04"].map((suffix, index) => ({
    itemId: `B01-${suffix}`,
    normalizedTitle: `合成资料 ${index + 1}`,
    observedScopeStatus: "CONFIRMED",
    rightsScopeStatus: "UNKNOWN",
  }));

const makeCandidate = (recordId: string): TestRecord => {
  const isQuark = recordId.startsWith("Q-");
  const isCollection = recordId === "B01-BAIDU-COLLECTION";
  const isCet4 = recordId.includes("CET4");
  const group = recordId.startsWith("B01") || recordId === "Q-B01-UNMAPPED" ? "B-01" : "B-02";
  const level = isCet4 ? "CET4" : recordId.includes("CET6") ? "CET6" : null;
  const platform = isQuark ? "quark" : "baidu";
  const candidateKind = isCollection ? "collection" : isQuark ? "platform_equivalence_candidate" : "independent_level_entry";
  const productDecisionStatus = isQuark ? "CONFIRMED_FOR_INDEPENDENT_RECORD_ONLY" : "CONFIRMED";
  const linkedItems = isCollection ? collectionItems() : [];
  const baseId = isQuark
    ? recordId === "Q-B01-UNMAPPED"
      ? "B01-BAIDU-COLLECTION"
      : level === "CET4"
        ? "B02-CET4-BAIDU"
        : level === "CET6"
          ? "B02-CET6-BAIDU"
          : null
    : null;

  return {
    recordId,
    candidateGroup: group,
    candidateKind,
    platform,
    title: `合成候选 ${recordId}`,
    path: {
      rootAlias: isQuark ? "Q-C0" : "B-C0",
      canonicalPath: isQuark ? null : `B-C0/synthetic/${recordId}`,
      ...(isQuark
        ? {
            observedRelatedPath: `Q-C0/synthetic/${recordId}`,
            pathRole: "related_only",
            historicalMappingStatus: "UNKNOWN",
            reason: "合成夸克节点未建立精确对应。",
          }
        : { historicalPathMappingStatus: "CONFIRMED" }),
      exactPathStatus: isQuark ? "UNKNOWN" : "CONFIRMED",
      currentDirectoryReadability: isQuark ? "UNKNOWN" : "CONFIRMED",
      currentShareRecordPathStatus: "UNKNOWN",
      lastEvidenceAt: "synthetic-not-run",
      evidenceRefs: localEvidence(),
    },
    scope: {
      displayGranularity: isCollection ? "one_collection" : isQuark && !level ? "unresolved" : "independent_level_entry",
      productDecisionStatus,
      canonicalScopeCode: `${recordId}-SCOPE`,
      ...(level ? { level } : {}),
      ...(isCollection ? {} : isQuark ? {} : { parentCollectionPath: "B-C0/synthetic" }),
      linkedItems,
      ...(isCollection ? { visibleObservedCount: 4 } : { visibleDirectSubdirectoryCount: 2 }),
      currentScopeStatus: "UNKNOWN",
      completeness: "UNKNOWN",
      paginationTermination: "UNKNOWN",
      contentRead: false,
      scopeNote: "合成测试数据；未读取任何云端目录或正文。",
    },
    sourceAndRights: {
      acquisitionSource: evidence("UNKNOWN", "来源未核验。"),
      rightsHolder: evidence("UNKNOWN", "权利方未核验。"),
      writtenPublicLicense: {
        status: "BLOCKED",
        coversExactScope: false,
        evidenceRefs: [],
        reason: "未提供公开许可证据。",
      },
      redistributionLicense: {
        status: "BLOCKED",
        coversExactScope: false,
        audienceAndChannelConfirmed: false,
        evidenceRefs: [],
        reason: "未提供再分发许可证据。",
      },
    },
    shareEvidence: {
      historicalMapping: isQuark
        ? {
            status: "UNKNOWN",
            recordCount: 0,
            rawStatusValue: "NOT RUN",
            rawStatusMeaning: "NOT RUN",
            reason: "夸克分享映射未执行。",
          }
        : {
            status: "CONFIRMED",
            exactPathRecordCount: 1,
            parentCoverageObserved: true,
            historicalCreatedAt: ["synthetic-2026-01-01"],
            rawStatusValue: "0",
            rawStatusMeaning: "UNKNOWN",
            evidenceRefs: localEvidence(),
          },
      currentShareStatus: {
        status: "UNKNOWN",
        evidenceAt: "synthetic-not-run",
        ...(isQuark ? {} : { pagesRead: 2, candidateNameMatches: 0, continuationObserved: true }),
        reason: "当前分享状态未执行核验。",
      },
      directoryMarker: {
        status: isQuark ? "UNKNOWN" : "NOT OBSERVED",
        meaning: "合成数据不提供目录级分享标记。",
      },
      anonymousAccess: {
        status: "NOT RUN",
        requiredByCurrentTask: false,
        reason: "合成测试不打开分享入口。",
      },
    },
    overlapAndDuplicates: {
      parentChildOverlapRisk: isQuark ? "UNKNOWN" : "HIGH",
      observedGroups: isQuark ? [] : ["synthetic-parent-overlap"],
      duplicateCheck: {
        status: isQuark ? "NOT RUN" : "UNRESOLVED",
        decision: isQuark ? "WAIT_FOR_EXACT_QUARK_PATH" : "PENDING_MANUAL_REVIEW",
        canonicalCardCount: isQuark ? 0 : 1,
        reason: "合成数据不提供最终去重结论。",
      },
    },
    ...(baseId
      ? {
          correspondence: {
            baseCandidateRecordId: baseId,
            status: "UNKNOWN",
            requiredEvidence: ["精确平台路径", "范围对应证据"],
          },
        }
      : {}),
    reviewStatus: "BLOCKED",
    blockers: [`${recordId}_BLOCKED_FOR_SYNTHETIC_TEST`],
    readinessGate: {
      exactIdentity: !isQuark,
      exactPath: !isQuark,
      scopeComplete: false,
      currentShareResolved: false,
      sourceAndRightsEstablished: false,
      publicLicenseCoversExactScope: false,
      redistributionLicenseCoversExactScope: false,
      anonymousAccessSatisfied: false,
      duplicateDecisionComplete: false,
      redactionCheckPass: true,
      readyForReview: false,
      note: "合成数据保持阻断。",
    },
    humanReview: {
      decision: "PENDING",
      reviewer: null,
      reviewedAt: null,
      finalImportApproval: false,
    },
    evidenceRefs: localEvidence(),
  };
};

const makeFixture = (): TestRecord => ({
  schemaVersion: 1,
  round: "R17-29B",
  documentType: "local_candidate_review_draft",
  purpose: "合成候选审核卡转换测试。",
  formalManifestWrite: false,
  cloudOperationsInThisRound: 0,
  productDecisions: {
    "B-01": {
      displayGranularity: "one_collection",
      decisionStatus: "CONFIRMED",
      linkedItemCount: 4,
      rule: "合成 B-01 保持一个集合。",
    },
    "B-02": {
      displayGranularity: "two_independent_level_entries",
      decisionStatus: "CONFIRMED",
      candidateRecordIds: ["B02-CET4-BAIDU", "B02-CET6-BAIDU"],
      rule: "合成 CET4/CET6 保持独立。",
    },
    quark: {
      displayGranularity: "independent_platform_records",
      decisionStatus: "CONFIRMED",
      rule: "合成夸克候选独立保存。",
    },
  },
  sourceReview: {
    sourceIds: ["synthetic-source"],
    rightsReview: "synthetic-only",
  },
  statusLegend: {
    candidateReviewStatus: {
      HOLD: "等待审核。",
      BLOCKED: "必要条件未满足。",
      READY_FOR_REVIEW: "证据齐备，等待人工最终审核。",
    },
    evidenceStatus: {
      CONFIRMED: "证据支持。",
      UNKNOWN: "证据不足。",
      "NOT RUN": "未执行。",
      BLOCKED: "必要条件阻断。",
    },
  },
  candidates: CANDIDATE_IDS.map(makeCandidate),
  controlRecords: [
    {
      recordId: "Q-PARENT-UNIVERSITY-001",
      recordType: "non_candidate_parent_control",
      platform: "quark",
      path: {
        rootAlias: "Q-C0",
        observedPath: "Q-C0/synthetic-parent",
        exactCurrentPathStatus: "UNKNOWN",
      },
      historicalApproval: {
        status: "CONFIRMED_AS_LIMITED_OPERATION_APPROVAL",
        scope: "合成父级控制记录",
        doesNotProve: ["候选范围", "公开许可", "再分发许可"],
      },
      inheritanceAllowed: false,
      use: "仅用于验证不继承。",
    },
  ],
  globalReviewState: {
    canonicalCandidateCount: 6,
    candidateStatusCounts: { HOLD: 0, BLOCKED: 6, READY_FOR_REVIEW: 0 },
    currentShareStatus: "UNKNOWN",
    anonymousAccess: "NOT RUN",
    publicLicense: "BLOCKED",
    redistributionLicense: "BLOCKED",
    formalImport: "BLOCKED",
    reason: "合成数据保持阻断。",
  },
  redactionCheck: {
    completeShareUrlsIncluded: false,
    passcodesIncluded: false,
    cookiesTokensCredentialsIncluded: false,
    internalCloudIdentifiersIncluded: false,
    documentBodiesIncluded: false,
  },
  stopConditions: ["合成测试不得调用网盘。"],
});

const candidateOf = (input: TestRecord, recordId: string): TestRecord => {
  const candidate = asArray(input.candidates).find((item) => asRecord(item).recordId === recordId);
  if (!candidate) throw new Error(`missing test candidate ${recordId}`);
  return asRecord(candidate);
};

const expectRejected = (input: unknown, code: string) => {
  const result = convertCandidateReviewDraft(input);
  expect(result.status).toBe("rejected");
  if (result.status === "rejected") expect(result.code).toBe(code);
  return result;
};

describe("convertCandidateReviewDraft", () => {
  it("converts a complete synthetic draft without a manifest writer", () => {
    const result = convertCandidateReviewDraft(makeFixture());
    expect(result.status).toBe("accepted");
    if (result.status === "accepted") {
      expect(result.value.candidateCount).toBe(6);
      expect(result.value.cards).toHaveLength(6);
      expect(result.value.cards.every((card) => card.reviewStatus === "BLOCKED")).toBe(true);
      expect(result.value.cards.every((card) => card.publication.canPublish === false)).toBe(true);
      expect(result.value.formalManifestWrite).toBe(false);
      expect("manifest" in result.value).toBe(false);
    }
  });

  it("keeps B-01 as one collection with four unique PDF item references", () => {
    const result = convertCandidateReviewDraft(makeFixture());
    expect(result.status).toBe("accepted");
    if (result.status === "accepted") {
      const card = result.value.cards.find((item) => item.candidateId === "B01-BAIDU-COLLECTION");
      expect(card?.displayGranularity).toBe("one_collection");
      expect(card?.relatedItemIds).toEqual(["B01-P01", "B01-P02", "B01-P03", "B01-P04"]);
      expect(new Set(card?.relatedItemIds).size).toBe(4);
      expect(Object.keys(card?.card ?? {}).sort()).toEqual(["categoryId", "fileType", "name", "note", "sizeBytes", "sourceLabel"]);
      expect(card?.card.note).toBeNull();
      expect(card?.card.sourceLabel).toBe("百度网盘");
    }
  });

  it.each([
    ["missing", (input: TestRecord) => {
      const scope = asRecord(candidateOf(input, "B01-BAIDU-COLLECTION").scope);
      scope.linkedItems = asArray(scope.linkedItems).slice(0, 0);
    }],
    ["duplicate", (input: TestRecord) => {
      const items = asArray(asRecord(candidateOf(input, "B01-BAIDU-COLLECTION").scope).linkedItems);
      asRecord(items[1]).itemId = asRecord(items[0]).itemId;
    }],
    ["wrong-count", (input: TestRecord) => {
      asRecord(candidateOf(input, "B01-BAIDU-COLLECTION").scope).linkedItems = [...asArray(asRecord(candidateOf(input, "B01-BAIDU-COLLECTION").scope).linkedItems), { itemId: "B01-P05", normalizedTitle: "额外项", observedScopeStatus: "CONFIRMED", rightsScopeStatus: "UNKNOWN" }];
    }],
  ])("rejects B-01 linked-item %s", (_name, mutate) => {
    const input = makeFixture();
    mutate(input);
    expectRejected(input, "INVALID_COLLECTION");
  });

  it("keeps CET4 and CET6 independent", () => {
    const result = convertCandidateReviewDraft(makeFixture());
    expect(result.status).toBe("accepted");
    if (result.status === "accepted") {
      const levelCards = result.value.cards.filter((card) => card.candidateGroup === "B-02" && card.platform === "baidu");
      expect(levelCards.map((card) => card.candidateId)).toEqual(["B02-CET4-BAIDU", "B02-CET6-BAIDU"]);
      expect(levelCards.every((card) => card.relatedItemIds.length === 0)).toBe(true);
    }
  });

  it("isolates Baidu and Quark candidates and does not inherit Quark parent controls", () => {
    const result = convertCandidateReviewDraft(makeFixture());
    expect(result.status).toBe("accepted");
    if (result.status === "accepted") {
      expect(result.value.cards.filter((card) => card.platform === "baidu")).toHaveLength(3);
      expect(result.value.cards.filter((card) => card.platform === "quark")).toHaveLength(3);
      expect(result.value.cards.filter((card) => card.platform === "quark").every((card) => card.path.canonicalPath === null)).toBe(true);
      expect(result.value.controlRecords).toEqual([
        {
          recordId: "Q-PARENT-UNIVERSITY-001",
          recordType: "non_candidate_parent_control",
          platform: "quark",
          inheritanceAllowed: false,
          usedByCandidateIds: [],
        },
      ]);
      expect(result.value.cards.every((card) => card.correspondence?.baseCandidateRecordId !== "Q-PARENT-UNIVERSITY-001")).toBe(true);
    }
  });

  it("rejects a parent control that attempts inheritance", () => {
    const input = makeFixture();
    asRecord(asArray(input.controlRecords)[0]).inheritanceAllowed = true;
    expectRejected(input, "INVALID_CONTROL_RECORD");
  });

  it("preserves UNKNOWN, NOT RUN, BLOCKED and does not upgrade the review state", () => {
    const result = convertCandidateReviewDraft(makeFixture());
    expect(result.status).toBe("accepted");
    if (result.status === "accepted") {
      const card = result.value.cards[0];
      expect(card.reviewStatus).toBe("BLOCKED");
      expect(card.path.currentShareRecordPathStatus).toBe("UNKNOWN");
      expect(card.shareEvidence.currentShareStatus.status).toBe("UNKNOWN");
      expect(card.shareEvidence.anonymousAccess.status).toBe("NOT RUN");
      expect(card.rights.writtenPublicLicense.status).toBe("BLOCKED");
      expect(card.overlapAndDuplicates.duplicateCheck.status).toBe("UNRESOLVED");
      expect(card.readinessGate.readyForReview).toBe(false);
      expect(card.publication.canPublish).toBe(false);
    }
  });

  it("preserves an explicit HOLD state without promoting it to READY_FOR_REVIEW", () => {
    const input = makeFixture();
    const candidate = candidateOf(input, "B01-BAIDU-COLLECTION");
    candidate.reviewStatus = "HOLD";
    candidate.blockers = [];
    const result = convertCandidateReviewDraft(input);
    expect(result.status).toBe("accepted");
    if (result.status === "accepted") {
      const card = result.value.cards.find((item) => item.candidateId === "B01-BAIDU-COLLECTION");
      expect(card?.reviewStatus).toBe("HOLD");
      expect(card?.readinessGate.readyForReview).toBe(false);
      expect(card?.publication.canPublish).toBe(false);
    }
  });

  it("rejects a READY_FOR_REVIEW claim when licenses and evidence remain incomplete", () => {
    const input = makeFixture();
    const candidate = candidateOf(input, "B01-BAIDU-COLLECTION");
    candidate.reviewStatus = "READY_FOR_REVIEW";
    candidate.blockers = [];
    const gate = asRecord(candidate.readinessGate);
    for (const key of Object.keys(gate)) if (key !== "note") gate[key] = true;
    expectRejected(input, "INCONSISTENT_READINESS");
  });

  it("rejects sensitive fields and does not echo the sensitive value", () => {
    const input = makeFixture();
    input.passcode = "synthetic-secret-canary";
    const result = expectRejected(input, "SENSITIVE_INPUT");
    expect(JSON.stringify(result)).not.toContain("synthetic-secret-canary");

    const urlInput = makeFixture();
    candidateOf(urlInput, "B01-BAIDU-COLLECTION").title = "https://synthetic.example.invalid/share";
    expectRejected(urlInput, "SENSITIVE_INPUT");

    const shareInput = makeFixture();
    shareInput.shareUrl = "https://pan.baidu.com/s/synthetic";
    expectRejected(shareInput, "SENSITIVE_INPUT");

    const opaqueIdInput = makeFixture();
    opaqueIdInput.fid = "synthetic-opaque-id";
    expectRejected(opaqueIdInput, "SENSITIVE_INPUT");
  });

  it("does not mutate input or create partial output on invalid input", () => {
    const input = makeFixture();
    const before = JSON.stringify(input);
    asRecord(candidateOf(input, "B02-CET4-BAIDU").scope).linkedItems = [{ itemId: "wrong" }];
    const beforeConversion = JSON.stringify(input);
    const result = expectRejected(input, "INVALID_COLLECTION");
    expect(JSON.stringify(input)).toBe(beforeConversion);
    expect(JSON.stringify(result)).not.toContain("cards");
    expect(before).not.toBe(JSON.stringify(input));
  });

  it("is stable across repeated runs and input candidate ordering", () => {
    const firstInput = makeFixture();
    const first = convertCandidateReviewDraft(firstInput);
    const secondInput = makeFixture();
    asArray(secondInput.candidates).reverse();
    const second = convertCandidateReviewDraft(secondInput);
    const repeat = convertCandidateReviewDraft(makeFixture());
    expect(second).toEqual(first);
    expect(repeat).toEqual(first);
  });

  it("rejects invalid statuses and invalid cross-platform associations", () => {
    const invalidStatus = makeFixture();
    candidateOf(invalidStatus, "B02-CET4-BAIDU").reviewStatus = "PASS";
    expectRejected(invalidStatus, "INVALID_STATUS");

    const invalidAssociation = makeFixture();
    asRecord(candidateOf(invalidAssociation, "Q-B01-UNMAPPED").correspondence).baseCandidateRecordId = "B02-CET4-BAIDU";
    expectRejected(invalidAssociation, "INVALID_ASSOCIATION");
  });
});
