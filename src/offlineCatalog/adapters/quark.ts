import { normalizeProviderFile, normalizeTimestamp } from "../normalize";
import type { AdapterContext, AdapterResult } from "./common";
import {
  failure,
  identifierValue,
  isRecord,
  nullableSize,
  rawTimeValue,
  stringValue,
} from "./common";

const categoryName = (category: unknown, fileType: unknown) => {
  if (fileType === "0") return "folder";
  const names: Record<number, string> = {
    1: "video",
    2: "audio",
    3: "image",
    4: "document",
    5: "seed",
    6: "other",
    7: "archive",
    8: "application",
  };
  return typeof category === "number" ? names[category] ?? null : null;
};

const pathValue = (value: unknown) => {
  if (value == null) return null;
  if (typeof value === "string") return value.trim() || null;
  return "invalid" as const;
};

export const adaptQuarkFileEntry = (
  raw: unknown,
  context: AdapterContext,
): AdapterResult => {
  if (!isRecord(raw)) return failure("invalid-record", context.recordIndex);
  const providerFileId = identifierValue(raw.fid);
  if (!providerFileId) return failure("missing-id", context.recordIndex);
  const name = stringValue(raw.filename);
  if (!name) return failure("missing-name", context.recordIndex);
  const size = nullableSize(raw.size);
  if (size === "invalid") return failure("invalid-size", context.recordIndex);
  const pathHint = pathValue(raw.full_path);
  if (pathHint === "invalid") return failure("unsupported-path-shape", context.recordIndex);
  const createdRaw = rawTimeValue(raw.created_at);
  const modifiedRaw = rawTimeValue(raw.updated_at);
  if (createdRaw === "invalid" || modifiedRaw === "invalid") {
    return failure("invalid-time", context.recordIndex);
  }
  const createdAt = normalizeTimestamp(createdRaw, context.createdTimeFormat);
  const modifiedAt = normalizeTimestamp(modifiedRaw, context.modifiedTimeFormat);
  if ((createdRaw !== null && createdAt.utcIso === null) ||
      (modifiedRaw !== null && modifiedAt.utcIso === null)) {
    return failure("invalid-time", context.recordIndex);
  }

  return {
    ok: true,
    value: normalizeProviderFile({
      provider: "quark",
      providerFileId,
      parentId: identifierValue(raw.parent_fid),
      pathHint,
      name,
      fileType: categoryName(raw.category, raw.file_type),
      size,
      hash: stringValue(raw.content_hash),
      hashAlgorithm: null,
      createdAt,
      modifiedAt,
    }),
  };
};
