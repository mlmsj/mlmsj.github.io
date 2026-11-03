import { getCategoryPath } from "./categories";
import type { Resource } from "./resources";

/**
 * Legacy server response adapter. It remains isolated from the student-facing
 * static catalog and is fail-closed so an old API cannot become a second
 * public data source or bypass the authorization projection.
 */
export type PublicRecord = {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  publishedAt: string;
  fileType: string | null;
  sizeBytes: number | null;
  sourceLabel: string | null;
};

/** @deprecated Legacy records have no authorization evidence; keep them private. */
export const toResource = (record: PublicRecord): Resource => ({
  id: record.id,
  title: record.title,
  description: record.description,
  categoryId: record.categoryId,
  meta: record.publishedAt.slice(0, 10),
  tag: getCategoryPath(record.categoryId).map((category) => category.name).join(" / "),
  classificationStatus: "classified",
  publicationStatus: "draft",
  isPubliclyAccessible: false,
  publishedAt: record.publishedAt,
  ...(record.fileType ? { fileType: record.fileType } : {}),
  ...(record.sizeBytes === null ? {} : { sizeBytes: record.sizeBytes }),
});

/** @deprecated The legacy public endpoint is disabled; use the gated static manifest. */
export async function readPublic(
  path: string,
  signal?: AbortSignal,
  timeoutMs = 15_000,
) {
  void path;
  void signal;
  void timeoutMs;
  throw new Error("旧公开接口已停用，请使用经过授权投影的静态资料清单。");
}
