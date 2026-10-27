import { categories, getEnabledCategoryPath, type Category } from "./categories";

export const PUBLIC_MANIFEST_SCHEMA_VERSION = 1 as const;
export const PUBLIC_MANIFEST_URL = `${import.meta.env.BASE_URL}data/manifest.v1.json`;
export const PUBLIC_MANIFEST_FIELDS = ["schemaVersion", "generatedAt", "records"] as const;
export const PUBLIC_MANIFEST_RECORD_FIELDS = [
  "id",
  "title",
  "description",
  "categoryId",
  "provider",
  "shareUrl",
  "passcode",
  "accessStatus",
  "checkedOn",
  "publishedAt",
  "fileType",
  "sizeBytes",
] as const;

export const PUBLIC_PROVIDERS = ["quark", "baidu"] as const;
export type PublicManifestProvider = (typeof PUBLIC_PROVIDERS)[number];

export const PUBLIC_ACCESS_STATUSES = [
  "unchecked",
  "verified",
  "degraded",
  "expired",
  "withdrawn",
] as const;
export type PublicAccessStatus = (typeof PUBLIC_ACCESS_STATUSES)[number];

export type PublicManifestRecord = {
  id: string;
  title: string;
  categoryId: string;
  provider: PublicManifestProvider;
  shareUrl: string;
  accessStatus: PublicAccessStatus;
  publishedAt: string;
  description?: string;
  passcode?: string;
  checkedOn?: string | null;
  fileType?: string;
  sizeBytes?: number;
};

export type PublicManifest = {
  schemaVersion: typeof PUBLIC_MANIFEST_SCHEMA_VERSION;
  generatedAt: string;
  records: readonly PublicManifestRecord[];
};

export const PUBLIC_SHARE_HOSTS: Readonly<
  Record<PublicManifestProvider, readonly string[]>
> = {
  quark: ["pan.quark.cn"],
  baidu: ["pan.baidu.com"],
};

const ISO_DATE_TIME =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/u;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/u;
const SHARE_PATH = /^\/s\/[A-Za-z0-9_-]+\/?$/u;
const STABLE_ID = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/u;
const PUBLIC_TEXT_LEAKS = [
  /(?:^|[^a-z])(?:access[_ -]?token|authorization|cookie|password|secret|token)(?:$|[^a-z])/iu,
  /(?:^|[^a-z])(?:fid|fs_id|parent[_ -]?fid|stoken)(?:$|[^a-z])/iu,
  /(?:^|[^a-z])(?:session|request)[_ -]?id(?:$|[^a-z])/iu,
  /(?:[A-Za-z]:[\\/]|\\\\|\/(?:Users|home|private|tmp|var)\/)/u,
  /(?:^|[\\/])(?:browse|\.env|.*\.jsonl)(?:$|[\\/])/iu,
];

export type PublicManifestIssueCode =
  | "INVALID_ROOT"
  | "UNKNOWN_FIELD"
  | "INVALID_SCHEMA_VERSION"
  | "INVALID_GENERATED_AT"
  | "INVALID_RECORDS"
  | "INVALID_RECORD"
  | "DUPLICATE_ID"
  | "INVALID_ID"
  | "INVALID_TITLE"
  | "INVALID_DESCRIPTION"
  | "INVALID_CATEGORY"
  | "INVALID_PROVIDER"
  | "INVALID_SHARE_URL"
  | "INVALID_ACCESS_STATUS"
  | "INVALID_CHECKED_ON"
  | "STATUS_REQUIRES_CHECKED_ON"
  | "STATUS_FORBIDS_CHECKED_ON"
  | "INVALID_PUBLISHED_AT"
  | "INVALID_PASSCODE"
  | "INVALID_FILE_TYPE"
  | "INVALID_SIZE_BYTES"
  | "PUBLIC_FIELD_LEAK";

export type PublicManifestValidationIssue = {
  path: string;
  code: PublicManifestIssueCode;
};

export type PublicManifestValidationResult =
  | { ok: true; value: PublicManifest }
  | { ok: false; issues: readonly PublicManifestValidationIssue[] };

export type PublicManifestFetcher = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

const hasOwn = (value: object, key: string) =>
  Object.prototype.hasOwnProperty.call(value, key);

const hasControlCharacters = (value: string) => {
  for (const character of value) {
    const codePoint = character.codePointAt(0) ?? 0;
    if (codePoint <= 0x1f || codePoint === 0x7f) return true;
  }
  return false;
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" &&
  value !== null &&
  (Object.getPrototypeOf(value) === Object.prototype ||
    Object.getPrototypeOf(value) === null);

const checkUnknownFields = (
  value: Record<string, unknown>,
  allowed: readonly string[],
  path: string,
  issues: PublicManifestValidationIssue[],
) => {
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) {
      issues.push({ path: `${path}.${key}`, code: "UNKNOWN_FIELD" });
    }
  }
};

const validText = (value: unknown, maxLength: number, allowEmpty = false) =>
  typeof value === "string" &&
  value.length <= maxLength &&
  (allowEmpty || value.trim().length > 0) &&
  !hasControlCharacters(value);

const validIsoDateTime = (value: unknown) => {
  if (typeof value !== "string" || !ISO_DATE_TIME.test(value)) return false;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp);
};

const validIsoDate = (value: unknown) => {
  if (typeof value !== "string" || !ISO_DATE.test(value)) return false;
  const timestamp = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(timestamp) &&
    new Date(timestamp).toISOString().slice(0, 10) === value;
};

const isProvider = (value: unknown): value is PublicManifestProvider =>
  typeof value === "string" &&
  (PUBLIC_PROVIDERS as readonly string[]).includes(value);

const isAccessStatus = (value: unknown): value is PublicAccessStatus =>
  typeof value === "string" &&
  (PUBLIC_ACCESS_STATUSES as readonly string[]).includes(value);

export const containsPublicFieldLeak = (value: string) =>
  PUBLIC_TEXT_LEAKS.some((pattern) => pattern.test(value));

export const isAllowedPublicShareUrl = (
  provider: PublicManifestProvider,
  value: unknown,
): value is string => {
  if (
    typeof value !== "string" ||
    value.length > 2048 ||
    value !== value.trim() ||
    value.includes("\\") ||
    hasControlCharacters(value)
  ) {
    return false;
  }

  const authority = /^https:\/\/([^/?#]+)/iu.exec(value)?.[1];
  if (!authority || authority.includes(":")) return false;

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return false;
  }

  return (
    parsed.protocol === "https:" &&
    parsed.username === "" &&
    parsed.password === "" &&
    parsed.port === "" &&
    parsed.search === "" &&
    parsed.hash === "" &&
    PUBLIC_SHARE_HOSTS[provider].includes(parsed.hostname) &&
    SHARE_PATH.test(parsed.pathname)
  );
};

const issue = (
  issues: PublicManifestValidationIssue[],
  path: string,
  code: PublicManifestIssueCode,
) => issues.push({ path, code });

export const validatePublicManifest = (
  input: unknown,
  categoryValues: readonly Category[] = categories,
): PublicManifestValidationResult => {
  if (!isObject(input)) {
    return { ok: false, issues: [{ path: "$", code: "INVALID_ROOT" }] };
  }

  const issues: PublicManifestValidationIssue[] = [];
  checkUnknownFields(input, PUBLIC_MANIFEST_FIELDS, "$", issues);

  if (input.schemaVersion !== PUBLIC_MANIFEST_SCHEMA_VERSION) {
    issue(issues, "$.schemaVersion", "INVALID_SCHEMA_VERSION");
  }
  if (!validIsoDateTime(input.generatedAt)) {
    issue(issues, "$.generatedAt", "INVALID_GENERATED_AT");
  }
  if (!Array.isArray(input.records)) {
    issue(issues, "$.records", "INVALID_RECORDS");
    return { ok: false, issues };
  }

  const ids = new Set<string>();
  input.records.forEach((rawRecord, index) => {
    const path = `$.records[${index}]`;
    if (!isObject(rawRecord)) {
      issue(issues, path, "INVALID_RECORD");
      return;
    }

    checkUnknownFields(rawRecord, PUBLIC_MANIFEST_RECORD_FIELDS, path, issues);

    const id = rawRecord.id;
    if (typeof id !== "string" || !STABLE_ID.test(id)) {
      issue(issues, `${path}.id`, "INVALID_ID");
    } else if (ids.has(id)) {
      issue(issues, `${path}.id`, "DUPLICATE_ID");
    } else {
      ids.add(id);
    }

    const title = rawRecord.title;
    if (!validText(title, 240)) {
      issue(issues, `${path}.title`, "INVALID_TITLE");
    } else if (typeof title === "string" && containsPublicFieldLeak(title)) {
      issue(issues, `${path}.title`, "PUBLIC_FIELD_LEAK");
    }

    const description = rawRecord.description;
    if (
      hasOwn(rawRecord, "description") &&
      (!validText(description, 4000, true) ||
        (typeof description === "string" && containsPublicFieldLeak(description)))
    ) {
      issue(
        issues,
        `${path}.description`,
        typeof description === "string" && containsPublicFieldLeak(description)
          ? "PUBLIC_FIELD_LEAK"
          : "INVALID_DESCRIPTION",
      );
    }

    const categoryId = rawRecord.categoryId;
    const categoryPath =
      typeof categoryId === "string"
        ? getEnabledCategoryPath(categoryId, categoryValues)
        : [];
    if (categoryPath.length === 0) {
      issue(issues, `${path}.categoryId`, "INVALID_CATEGORY");
    }

    const provider = rawRecord.provider;
    if (!isProvider(provider)) {
      issue(issues, `${path}.provider`, "INVALID_PROVIDER");
    }

    if (
      !isProvider(provider) ||
      !isAllowedPublicShareUrl(provider, rawRecord.shareUrl)
    ) {
      issue(issues, `${path}.shareUrl`, "INVALID_SHARE_URL");
    }

    const accessStatus = rawRecord.accessStatus;
    if (!isAccessStatus(accessStatus)) {
      issue(issues, `${path}.accessStatus`, "INVALID_ACCESS_STATUS");
    }

    const checkedOn = rawRecord.checkedOn;
    if (
      hasOwn(rawRecord, "checkedOn") &&
      checkedOn !== null &&
      !validIsoDate(checkedOn)
    ) {
      issue(issues, `${path}.checkedOn`, "INVALID_CHECKED_ON");
    }
    if (
      accessStatus === "verified" &&
      (typeof checkedOn !== "string" || !validIsoDate(checkedOn))
    ) {
      issue(issues, `${path}.checkedOn`, "STATUS_REQUIRES_CHECKED_ON");
    }
    if (
      accessStatus === "unchecked" &&
      checkedOn !== undefined &&
      checkedOn !== null
    ) {
      issue(issues, `${path}.checkedOn`, "STATUS_FORBIDS_CHECKED_ON");
    }

    if (!validIsoDateTime(rawRecord.publishedAt)) {
      issue(issues, `${path}.publishedAt`, "INVALID_PUBLISHED_AT");
    }

    const passcode = rawRecord.passcode;
    if (
      hasOwn(rawRecord, "passcode") &&
      (typeof passcode !== "string" ||
        passcode.length === 0 ||
        passcode.length > 64 ||
        /\s/u.test(passcode) ||
        hasControlCharacters(passcode))
    ) {
      issue(issues, `${path}.passcode`, "INVALID_PASSCODE");
    }

    const fileType = rawRecord.fileType;
    if (
      hasOwn(rawRecord, "fileType") &&
      !validText(fileType, 100)
    ) {
      issue(issues, `${path}.fileType`, "INVALID_FILE_TYPE");
    }

    const sizeBytes = rawRecord.sizeBytes;
    if (
      hasOwn(rawRecord, "sizeBytes") &&
      (typeof sizeBytes !== "number" ||
        !Number.isSafeInteger(sizeBytes) ||
        sizeBytes < 0)
    ) {
      issue(issues, `${path}.sizeBytes`, "INVALID_SIZE_BYTES");
    }
  });

  return issues.length > 0
    ? { ok: false, issues }
    : { ok: true, value: input as PublicManifest };
};

export const parsePublicManifest = (
  input: unknown,
  categoryValues: readonly Category[] = categories,
): PublicManifest => {
  const result = validatePublicManifest(input, categoryValues);
  if (!result.ok) throw new Error("公开清单校验失败");
  return result.value;
};

export const loadPublicManifest = async (
  fetcher: PublicManifestFetcher = (input, init) => fetch(input, init),
  url = PUBLIC_MANIFEST_URL,
): Promise<PublicManifest> => {
  let response: Response;
  try {
    response = await fetcher(url, {
      cache: "no-store",
      credentials: "omit",
    });
  } catch {
    throw new Error("公开清单服务暂不可用");
  }

  if (!response.ok) throw new Error("公开清单服务暂不可用");

  let raw: unknown;
  try {
    raw = await response.json();
  } catch {
    throw new Error("公开清单格式无效");
  }
  return parsePublicManifest(raw);
};
