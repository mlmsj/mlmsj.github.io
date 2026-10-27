/** Offline policy model only. No HTTP client, credentials, filesystem or logging. */
export const ERROR_CODES = [
  "tls_failure", "network_failure", "redirect_blocked", "invalid_scope",
  "pagination_unverified", "provider_failure", "invalid_policy", "limit_exceeded",
] as const;
export type SafetyCode = typeof ERROR_CODES[number];
export type SafetyError = { ok: false; code: SafetyCode };
const failure = (code: SafetyCode): SafetyError => ({ ok: false, code });

export type HttpPolicy = {
  verifyCertificateChain: true;
  verifyHostname: true;
  retryWithVerificationDisabled: false;
  followRedirects: false;
  inheritEnvironmentProxy: false;
  logRequestBody: false;
  logResponseBody: false;
  httpDebug: false;
  caMode: "system" | "approved_custom";
};

export const createHttpPolicy = (
  config: { customCaRequested?: boolean; customCaApproved?: boolean } = {},
): { ok: true; policy: HttpPolicy } | SafetyError => {
  if (config.customCaRequested && config.customCaApproved !== true) return failure("invalid_policy");
  return { ok: true, policy: Object.freeze({
    verifyCertificateChain: true, verifyHostname: true,
    retryWithVerificationDisabled: false, followRedirects: false,
    inheritEnvironmentProxy: false, logRequestBody: false, logResponseBody: false,
    httpDebug: false, caMode: config.customCaRequested ? "approved_custom" : "system",
  }) };
};

/** Reject every redirect, including same-host redirects. Never returns either URL. */
export const evaluateRedirect = (_source: unknown, _target: unknown): SafetyError =>
  failure("redirect_blocked");

/** No exception inspection/stringification: even hostile getters remain private. */
export const anonymousError = (kind: SafetyCode, _cause?: unknown): SafetyError =>
  failure(ERROR_CODES.includes(kind) ? kind : "provider_failure");

const canonicalDirectory = (value: unknown): value is string => {
  if (typeof value !== "string" || !value.startsWith("/") || value === "/") return false;
  if (value !== value.trim() || value !== value.normalize("NFC")) return false;
  if (/[\\%?#]/u.test(value) || [...value].some((char) =>
    char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127)) return false;
  return value.slice(1).split("/").every((part) => part !== "" && part !== "." && part !== "..");
};

/** Exact canonical match; rejects ambiguous encodings rather than decoding them. */
export const authorizeDirectory = (
  directory: unknown, approvedDirectories: readonly string[],
): { ok: true } | SafetyError =>
  canonicalDirectory(directory) && approvedDirectories.some((item) =>
    canonicalDirectory(item) && item === directory)
    ? { ok: true } : failure("invalid_scope");

export type PaginationEvidence = {
  serverItemLimitVerified: boolean;
  serverPageMaximum: number | null;
  pageNumberingVerified: boolean;
  endProtocolVerified: boolean;
};
/** Static evidence for the existing external wrapper, not provider capability claims. */
export const CURRENT_BAIDU_EVIDENCE: Readonly<PaginationEvidence> = Object.freeze({
  serverItemLimitVerified: false, serverPageMaximum: null,
  pageNumberingVerified: false, endProtocolVerified: false,
});
export type ReadBudget = {
  maxPages: number;
  maxItems: number;
  requestedPageCount: number;
  fetchedItemCount: number;
  processedItemCount: number;
};
const count = (value: number) => Number.isSafeInteger(value) && value >= 0;
const validBudget = (budget: ReadBudget) =>
  [budget.maxPages, budget.maxItems, budget.requestedPageCount,
    budget.fetchedItemCount, budget.processedItemCount].every(count) &&
  budget.maxPages >= 1 && budget.maxPages <= 2 &&
  budget.maxItems >= 1 && budget.maxItems <= 100 &&
  budget.processedItemCount <= budget.fetchedItemCount;

/** Gate BEFORE a future request; client-side truncation cannot satisfy this gate. */
export const gateNextPage = (
  evidence: PaginationEvidence, budget: ReadBudget,
): { ok: true } | SafetyError => {
  if (!validBudget(budget)) return failure("invalid_policy");
  if (budget.requestedPageCount >= budget.maxPages || budget.fetchedItemCount >= budget.maxItems) {
    return failure("limit_exceeded");
  }
  if (!evidence.serverItemLimitVerified || !evidence.pageNumberingVerified ||
      !evidence.endProtocolVerified || evidence.serverPageMaximum === null ||
      !Number.isSafeInteger(evidence.serverPageMaximum) || evidence.serverPageMaximum <= 0) {
    return failure("pagination_unverified");
  }
  if (evidence.serverPageMaximum > budget.maxItems - budget.fetchedItemCount) {
    return failure("limit_exceeded");
  }
  return { ok: true };
};

export type AnonymousSummary = {
  ok: true;
  requestedPageCount: number;
  fetchedItemCount: number;
  processedItemCount: number;
  endSignalKnown: boolean;
  status: "complete" | "partial";
};
export const summarizeRead = (
  budget: ReadBudget, endSignalKnown: boolean, endReached: boolean,
): AnonymousSummary | SafetyError => {
  if (!validBudget(budget)) return failure("invalid_policy");
  if (budget.requestedPageCount > budget.maxPages || budget.fetchedItemCount > budget.maxItems) {
    return failure("limit_exceeded");
  }
  const complete = budget.requestedPageCount > 0 && endSignalKnown === true &&
    endReached === true && budget.processedItemCount === budget.fetchedItemCount;
  return { ok: true, requestedPageCount: budget.requestedPageCount,
    fetchedItemCount: budget.fetchedItemCount, processedItemCount: budget.processedItemCount,
    endSignalKnown: endSignalKnown === true, status: complete ? "complete" : "partial" };
};

export type SimulatedOutcome =
  | { kind: "success"; fetchedItemCount: number; processedItemCount: number;
      endSignalKnown: boolean; endReached: boolean; raw?: unknown }
  | { kind: "tls_failure" | "network_failure" | "redirect_blocked" | "provider_failure"; raw?: unknown };

/** One explicitly injected FAKE transport call. Not a production transport adapter. */
export const simulateRead = async (
  directory: unknown, approvedDirectories: readonly string[],
  evidence: PaginationEvidence, budget: ReadBudget,
  transport: (policy: HttpPolicy) => Promise<SimulatedOutcome>,
  caConfig: Parameters<typeof createHttpPolicy>[0] = {},
): Promise<AnonymousSummary | SafetyError> => {
  const scope = authorizeDirectory(directory, approvedDirectories);
  if (!scope.ok) return scope;
  const policy = createHttpPolicy(caConfig);
  if (!policy.ok) return policy;
  const initialBudget = { ...budget };
  const initialEvidence = { ...evidence };
  const gate = gateNextPage(initialEvidence, initialBudget);
  if (!gate.ok) return gate;
  try {
    const outcome = await transport(policy.policy);
    if (outcome.kind !== "success") return anonymousError(outcome.kind);
    if (!count(outcome.fetchedItemCount) || !count(outcome.processedItemCount)) return failure("provider_failure");
    if (outcome.fetchedItemCount > initialEvidence.serverPageMaximum!) return failure("limit_exceeded");
    return summarizeRead({ ...initialBudget,
      requestedPageCount: initialBudget.requestedPageCount + 1,
      fetchedItemCount: initialBudget.fetchedItemCount + outcome.fetchedItemCount,
      processedItemCount: initialBudget.processedItemCount + outcome.processedItemCount,
    }, outcome.endSignalKnown && initialEvidence.endProtocolVerified, outcome.endReached);
  } catch {
    return failure("network_failure");
  }
};
