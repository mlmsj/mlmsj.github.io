import { identityKeyForFile } from "../normalize";
import type { Provider, ScanStopReason, Snapshot } from "../types";
import type { AdapterContext, AdapterError, AdapterResult, TimestampFormat } from "./common";

export type SimulatedPage = {
  pageNumber: number;
  cursor: string | null;
  nextCursor: string | null;
  entries: readonly unknown[];
  endOfListing: boolean;
  permissionScopeFingerprint: string;
  schemaKnown?: boolean;
  errorCode?: string | null;
  timedOut?: boolean;
};

export type CollectContext = {
  provider: Provider;
  scanBatchId: string;
  scopeLocatorType: "provider_id" | "path";
  scopeLocator: string;
  permissionScopeFingerprint: string;
  startedAt: string;
  completedAt: string;
  maxPages?: number;
  maxItems?: number;
  createdTimeFormat: TimestampFormat;
  modifiedTimeFormat: TimestampFormat;
  toolVersion?: string | null;
};

export type CollectionError =
  | { code: "duplicate-page" | "missing-page" | "cursor-loop" | "permission-changed" | "unknown-schema" | "provider-error" | "timeout"; pageNumber: number }
  | AdapterError
  | { code: "duplicate-identity"; recordIndex: number };

export type CollectionResult = {
  snapshot: Snapshot;
  errors: readonly CollectionError[];
};

type Adapter = (raw: unknown, context: AdapterContext) => AdapterResult;

export const collectSimulatedPages = (
  pages: readonly SimulatedPage[],
  context: CollectContext,
  adapter: Adapter,
): CollectionResult => {
  const maxPages = context.maxPages ?? 2;
  const maxItems = context.maxItems ?? 100;
  const files = [] as Snapshot["files"] extends readonly (infer Item)[] ? Item[] : never;
  const errors: CollectionError[] = [];
  const seenPages = new Set<number>();
  const seenCursors = new Set<string>();
  const seenIdentities = new Set<string>();
  let pagesRead = 0;
  let itemsRead = 0;
  let stopReason: ScanStopReason = "cancelled";
  let status: "complete" | "partial" | "failed" = "partial";
  let paginationComplete = false;

  for (let index = 0; index < pages.length; index += 1) {
    const page = pages[index];
    const expectedPage = pagesRead + 1;
    if (seenPages.has(page.pageNumber)) {
      errors.push({ code: "duplicate-page", pageNumber: page.pageNumber });
      stopReason = "pagination_error";
      break;
    }
    if (page.pageNumber !== expectedPage) {
      errors.push({ code: "missing-page", pageNumber: page.pageNumber });
      stopReason = "pagination_error";
      break;
    }
    if (page.cursor && seenCursors.has(page.cursor)) {
      errors.push({ code: "cursor-loop", pageNumber: page.pageNumber });
      stopReason = "pagination_error";
      break;
    }
    if (page.permissionScopeFingerprint !== context.permissionScopeFingerprint) {
      errors.push({ code: "permission-changed", pageNumber: page.pageNumber });
      stopReason = "permission_changed";
      break;
    }
    if (page.schemaKnown === false) {
      errors.push({ code: "unknown-schema", pageNumber: page.pageNumber });
      stopReason = "provider_error";
      status = "failed";
      break;
    }
    if (page.timedOut || page.errorCode) {
      errors.push({ code: page.timedOut ? "timeout" : "provider-error", pageNumber: page.pageNumber });
      stopReason = "provider_error";
      status = "failed";
      break;
    }
    if (pagesRead >= maxPages) {
      stopReason = "max_pages";
      break;
    }

    seenPages.add(page.pageNumber);
    if (page.cursor) seenCursors.add(page.cursor);
    pagesRead += 1;

    for (const entry of page.entries) {
      if (itemsRead >= maxItems) {
        stopReason = "max_items";
        break;
      }
      const recordIndex = itemsRead;
      const adapted = adapter(entry, {
        recordIndex,
        createdTimeFormat: context.createdTimeFormat,
        modifiedTimeFormat: context.modifiedTimeFormat,
      });
      itemsRead += 1;
      if (!adapted.ok) {
        errors.push(adapted.error);
        stopReason = "provider_error";
        status = "failed";
        break;
      }
      const identity = identityKeyForFile(adapted.value);
      if (seenIdentities.has(identity)) {
        errors.push({ code: "duplicate-identity", recordIndex });
        stopReason = "pagination_error";
        break;
      }
      seenIdentities.add(identity);
      files.push(adapted.value);
    }

    if (errors.length > 0 || stopReason === "max_items") break;
    if (page.endOfListing) {
      paginationComplete = true;
      stopReason = "completed";
      status = "complete";
      break;
    }
    if (itemsRead >= maxItems) {
      stopReason = "max_items";
      break;
    }
    if (page.nextCursor && seenCursors.has(page.nextCursor)) {
      errors.push({ code: "cursor-loop", pageNumber: page.pageNumber });
      stopReason = "pagination_error";
      break;
    }
    if (pagesRead >= maxPages) {
      stopReason = "max_pages";
      break;
    }
  }

  if (pages.length === 0) {
    errors.push({ code: "missing-page", pageNumber: 1 });
    stopReason = "pagination_error";
  } else if (!paginationComplete && stopReason === "cancelled") {
    stopReason = "pagination_error";
  }

  const scopeComplete = status === "complete" && paginationComplete && errors.length === 0;
  return {
    snapshot: {
      batch: {
        scanBatchId: context.scanBatchId,
        provider: context.provider,
        scopeLocatorType: context.scopeLocatorType,
        scopeLocator: context.scopeLocator,
        recursive: false,
        startedAt: context.startedAt,
        completedAt: context.completedAt,
        maxPages,
        maxItems,
        pagesRead,
        itemsRead,
        paginationComplete,
        stopReason,
        permissionScopeFingerprint: context.permissionScopeFingerprint,
        status,
        scopeComplete,
        toolVersion: context.toolVersion,
      },
      files: [...files].sort((left, right) =>
        identityKeyForFile(left).localeCompare(identityKeyForFile(right)),
      ),
    },
    errors,
  };
};
