import { describe, expect, it, vi } from "vitest";
import {
  anonymousError, authorizeDirectory, createHttpPolicy, CURRENT_BAIDU_EVIDENCE,
  evaluateRedirect, gateNextPage, simulateRead, summarizeRead,
} from "./baiduSafety";
import type { PaginationEvidence, ReadBudget, SimulatedOutcome } from "./baiduSafety";

// Entirely invented; .invalid is reserved and no transport accesses it.
const canary = "FICTIONAL_CANARY_TOKEN_R13_ONLY";
const privateMarker = "FICTIONAL_PRIVATE_ID_R13_ONLY";
const raw = { url: `https://example.invalid/list?access_token=${canary}`,
  token: canary, id: privateMarker, path: "/invented-private/entry", response: canary };
const scope = "/fictional-approved";
const evidence: PaginationEvidence = { serverItemLimitVerified: true, serverPageMaximum: 50,
  pageNumberingVerified: true, endProtocolVerified: true };
const budget: ReadBudget = { maxPages: 2, maxItems: 100,
  requestedPageCount: 0, fetchedItemCount: 0, processedItemCount: 0 };
const success: SimulatedOutcome = { kind: "success", fetchedItemCount: 2, processedItemCount: 2,
  endSignalKnown: true, endReached: true, raw };

describe("offline HTTP policy (not a TLS handshake)", () => {
  it("enables chain/hostname verification and forbids downgrade, redirects, proxies and logs", () => {
    const result = createHttpPolicy();
    expect(result).toEqual({ ok: true, policy: {
      verifyCertificateChain: true, verifyHostname: true, retryWithVerificationDisabled: false,
      followRedirects: false, inheritEnvironmentProxy: false, logRequestBody: false,
      logResponseBody: false, httpDebug: false, caMode: "system",
    } });
    if (result.ok) expect(Object.isFrozen(result.policy)).toBe(true);
  });
  it("rejects unapproved custom CA", () => {
    expect(createHttpPolicy({ customCaRequested: true })).toEqual({ ok: false, code: "invalid_policy" });
  });
  it("models an approved custom CA without reading a CA file", () => {
    expect(createHttpPolicy({ customCaRequested: true, customCaApproved: true }))
      .toMatchObject({ ok: true, policy: { caMode: "approved_custom", verifyHostname: true } });
  });
  it.each(["https://other.invalid/list", "http://example.invalid/list", "https://example.invalid/next"])
    ("blocks redirect to %s without revealing URLs", (target) => {
      expect(evaluateRedirect(raw.url, target)).toEqual({ ok: false, code: "redirect_blocked" });
    });
});

describe("exact directory authorization", () => {
  it.each([undefined, null, "", "/", "relative", "/unapproved", `${scope}/child`,
    "/fictional-approved/../escape", "/fictional-approved/./entry", "/fictional-approved//entry",
    "/fictional-approved/", "/fictional-approved%2fentry", "/fictional-approved\\entry",
    "/fictional-approved?token=fake", "/fictional-approved#entry", " /fictional-approved", "/fictional-approved\n"])
    ("rejects invalid or unapproved path %#", (path) => {
      expect(authorizeDirectory(path, [scope])).toEqual({ ok: false, code: "invalid_scope" });
    });
  it("allows only an exact canonical fictional directory", () => {
    expect(authorizeDirectory(scope, [scope])).toEqual({ ok: true });
    expect(authorizeDirectory("/", ["/"])).toEqual({ ok: false, code: "invalid_scope" });
  });
});

describe("actual fetch budget and anonymous output", () => {
  it("blocks the current external wrapper before invoking even a fake transport", async () => {
    const transport = vi.fn(async () => success);
    expect(await simulateRead(scope, [scope], CURRENT_BAIDU_EVIDENCE, budget, transport))
      .toEqual({ ok: false, code: "pagination_unverified" });
    expect(transport).not.toHaveBeenCalled();
  });
  it.each([
    { serverItemLimitVerified: false }, { serverPageMaximum: null },
    { serverPageMaximum: 0 }, { pageNumberingVerified: false }, { endProtocolVerified: false },
  ])("blocks incomplete evidence %#", (change) => {
    expect(gateNextPage({ ...evidence, ...change }, budget))
      .toEqual({ ok: false, code: "pagination_unverified" });
  });
  it("does not mistake a 100-item processing cap for a server limit", () => {
    expect(gateNextPage({ ...evidence, serverPageMaximum: 101 }, budget))
      .toEqual({ ok: false, code: "limit_exceeded" });
    expect(summarizeRead({ ...budget, requestedPageCount: 1, fetchedItemCount: 101, processedItemCount: 100 }, true, true))
      .toEqual({ ok: false, code: "limit_exceeded" });
  });
  it("checks the remaining budget and page cap before a request", () => {
    expect(gateNextPage(evidence, { ...budget, fetchedItemCount: 60 }))
      .toEqual({ ok: false, code: "limit_exceeded" });
    expect(gateNextPage(evidence, { ...budget, requestedPageCount: 2 }))
      .toEqual({ ok: false, code: "limit_exceeded" });
  });
  it.each([{ maxPages: 3 }, { maxItems: 101 }, { fetchedItemCount: -1 },
    { requestedPageCount: 0.5 }, { processedItemCount: 1 }])("rejects invalid counters %#", (change) => {
    expect(gateNextPage(evidence, { ...budget, ...change })).toEqual({ ok: false, code: "invalid_policy" });
  });
  it("keeps unknown end, client truncation and zero-request observations partial", () => {
    expect(summarizeRead({ ...budget, requestedPageCount: 1 }, false, true)).toMatchObject({ status: "partial" });
    expect(summarizeRead({ ...budget, requestedPageCount: 1, fetchedItemCount: 50, processedItemCount: 10 }, true, true))
      .toMatchObject({ status: "partial" });
    expect(summarizeRead(budget, true, true)).toMatchObject({ status: "partial" });
  });
  it("accepts explicit end at the exact cap, but never infers end from the cap", () => {
    const full = { ...budget, requestedPageCount: 2, fetchedItemCount: 100, processedItemCount: 100 };
    expect(summarizeRead(full, true, true)).toMatchObject({ status: "complete" });
    expect(summarizeRead(full, true, false)).toMatchObject({ status: "partial" });
  });
  it("returns only counters on the simulated trusted path, preserving inputs", async () => {
    const before = structuredClone({ evidence, budget, success });
    const result = await simulateRead(scope, [scope], evidence, budget, async (policy) => {
      expect(policy.verifyCertificateChain && policy.verifyHostname).toBe(true);
      return success;
    });
    expect(result).toEqual({ ok: true, requestedPageCount: 1, fetchedItemCount: 2,
      processedItemCount: 2, endSignalKnown: true, status: "complete" });
    expect(JSON.stringify(result)).not.toContain(canary);
    expect(JSON.stringify(result)).not.toContain(privateMarker);
    expect({ evidence, budget, success }).toEqual(before);
  });
  it.each(["tls_failure", "network_failure", "redirect_blocked", "provider_failure"] as const)
    ("keeps %s anonymous and never retries or downgrades", async (kind) => {
      const log = vi.spyOn(console, "log");
      const warn = vi.spyOn(console, "warn");
      const error = vi.spyOn(console, "error");
      try {
        const transport = vi.fn(async (): Promise<SimulatedOutcome> => ({ kind, raw }));
        const result = await simulateRead(scope, [scope], evidence, budget, transport);
        expect(result).toEqual({ ok: false, code: kind });
        expect(transport).toHaveBeenCalledTimes(1);
        expect(JSON.stringify(result)).not.toContain(canary);
        expect(log).not.toHaveBeenCalled();
        expect(warn).not.toHaveBeenCalled();
        expect(error).not.toHaveBeenCalled();
      } finally { log.mockRestore(); warn.mockRestore(); error.mockRestore(); }
    });
  it("does not stringify URL-bearing exceptions or hostile causes", async () => {
    const cause = { get message(): string { throw new Error("must not inspect"); }, ...raw };
    expect(anonymousError("tls_failure", cause)).toEqual({ ok: false, code: "tls_failure" });
    const transport = vi.fn(async () => { throw new Error(raw.url); });
    expect(await simulateRead(scope, [scope], evidence, budget, transport))
      .toEqual({ ok: false, code: "network_failure" });
    expect(transport).toHaveBeenCalledTimes(1);
  });
  it("rejects a page violating the asserted server bound", async () => {
    expect(await simulateRead(scope, [scope], evidence, budget,
      async () => ({ ...success, fetchedItemCount: 51, processedItemCount: 51 })))
      .toEqual({ ok: false, code: "limit_exceeded" });
  });
  it("does not invoke transport on invalid scope or CA approval", async () => {
    const transport = vi.fn(async () => success);
    await simulateRead("/", [scope], evidence, budget, transport);
    await simulateRead(scope, [scope], evidence, budget, transport, { customCaRequested: true });
    expect(transport).not.toHaveBeenCalled();
  });
  it("keeps synthetic timeout, success and thrown exceptions out of every console channel", async () => {
    const methods = ["log", "warn", "error", "debug", "info", "trace"] as const;
    const spies = methods.map((method) => vi.spyOn(console, method));
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async () => {
      throw new Error("network forbidden in this fixture");
    });
    try {
      const outputs = [
        await simulateRead(scope, [scope], evidence, budget, async () => success),
        await simulateRead(scope, [scope], evidence, budget, async () => {
          throw { name: "TimeoutError", message: raw.url, raw };
        }),
      ];
      expect(outputs[1]).toEqual({ ok: false, code: "network_failure" });
      const visible = JSON.stringify(outputs);
      for (const marker of [canary, privateMarker, raw.path, raw.url]) expect(visible).not.toContain(marker);
      for (const spy of spies) expect(spy).not.toHaveBeenCalled();
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      for (const spy of spies) spy.mockRestore();
      fetchSpy.mockRestore();
    }
  });
});
