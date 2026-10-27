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

const categoryName = (category: unknown, isDirectory: boolean) => {
  if (isDirectory) return "folder";
  const names: Record<number, string> = {
    1: "video",
    2: "audio",
    3: "image",
    4: "document",
    5: "application",
    6: "other",
    7: "seed",
  };
  return typeof category === "number" ? names[category] ?? null : null;
};

export const adaptBaiduFileEntry = (
  raw: unknown,
  context: AdapterContext,
): AdapterResult => {
  if (!isRecord(raw)) return failure("invalid-record", context.recordIndex);
  const providerFileId = identifierValue(raw.fs_id);
  if (!providerFileId) return failure("missing-id", context.recordIndex);
  const name = stringValue(raw.server_filename);
  if (!name) return failure("missing-name", context.recordIndex);
  const size = nullableSize(raw.size);
  if (size === "invalid") return failure("invalid-size", context.recordIndex);
  const createdRaw = rawTimeValue(raw.server_ctime);
  const modifiedRaw = rawTimeValue(raw.server_mtime);
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
      provider: "baidu",
      providerFileId,
      parentId: null,
      pathHint: stringValue(raw.path),
      name,
      fileType: categoryName(raw.category, raw.isdir === 1),
      size,
      hash: null,
      hashAlgorithm: null,
      createdAt,
      modifiedAt,
    }),
  };
};
