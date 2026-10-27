import type { ProviderFile } from "../types";

export type AdapterErrorCode =
  | "invalid-record"
  | "missing-id"
  | "missing-name"
  | "invalid-size"
  | "invalid-time"
  | "unsupported-path-shape";

export type AdapterError = {
  code: AdapterErrorCode;
  recordIndex: number;
};

export type AdapterResult =
  | { ok: true; value: ProviderFile }
  | { ok: false; error: AdapterError };

export type TimestampFormat =
  | "iso"
  | "unix_seconds"
  | "unix_milliseconds";

export type AdapterContext = {
  recordIndex: number;
  createdTimeFormat: TimestampFormat;
  modifiedTimeFormat: TimestampFormat;
};

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const stringValue = (value: unknown) =>
  typeof value === "string" && value.trim() ? value : null;

export const identifierValue = (value: unknown) => {
  if (typeof value === "string") return value.trim() || null;
  if (typeof value === "bigint") return value.toString();
  if (typeof value === "number" && Number.isSafeInteger(value)) return String(value);
  return null;
};

export const nullableSize = (value: unknown): number | null | "invalid" => {
  if (value == null) return null;
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : "invalid";
};

export const rawTimeValue = (value: unknown): string | number | null | "invalid" => {
  if (value == null) return null;
  return typeof value === "string" ||
    (typeof value === "number" && Number.isFinite(value))
    ? value
    : "invalid";
};

export const failure = (
  code: AdapterErrorCode,
  recordIndex: number,
): AdapterResult => ({ ok: false, error: { code, recordIndex } });
