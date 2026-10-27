import type { Provider, ProviderFile, TimestampObservation } from "./types";

export const TIMESTAMP_CONVERSION_VERSION = "1";

export const providerIdentityKey = (provider: Provider, providerFileId: string) =>
  `${provider}:${providerFileId}`;

export const identityKeyForFile = (file: ProviderFile) =>
  providerIdentityKey(file.provider, file.providerFileId);

export const normalizeOptionalText = (value: string | null | undefined) => {
  const normalized = value?.trim();
  return normalized ? normalized : null;
};

export const normalizeNameForMatching = (value: string) =>
  value.normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase("zh-CN");

export const normalizeTimestamp = (
  rawValue: string | number | null,
  rawFormat: "iso" | "unix_seconds" | "unix_milliseconds" | null,
): TimestampObservation => {
  let utcIso: string | null = null;

  if (rawValue !== null && rawFormat !== null) {
    const milliseconds =
      rawFormat === "unix_seconds"
        ? Number(rawValue) * 1000
        : rawFormat === "unix_milliseconds"
          ? Number(rawValue)
          : Date.parse(String(rawValue));
    const date = new Date(milliseconds);
    if (Number.isFinite(milliseconds) && !Number.isNaN(date.getTime())) {
      utcIso = date.toISOString();
    }
  }

  return {
    utcIso,
    rawValue,
    rawFormat,
    conversionVersion: TIMESTAMP_CONVERSION_VERSION,
  };
};

export const normalizeProviderFile = (file: ProviderFile): ProviderFile => ({
  ...file,
  providerFileId: file.providerFileId.trim(),
  parentId: normalizeOptionalText(file.parentId),
  pathHint: normalizeOptionalText(file.pathHint),
  name: file.name.trim(),
  fileType: normalizeOptionalText(file.fileType),
  hash: normalizeOptionalText(file.hash),
  hashAlgorithm: normalizeOptionalText(file.hashAlgorithm)?.toLocaleLowerCase() ?? null,
});
