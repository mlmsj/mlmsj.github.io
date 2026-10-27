import { getCategoryPath } from "./categories";
import type { Resource } from "./resources";

/**
 * Legacy server response adapter. It is intentionally isolated from the
 * student-facing static catalog so the old API cannot become a second public
 * data source or be bundled into the static page entry.
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

/** @deprecated Keep only for local/server-mode compatibility. */
export const toResource = (record: PublicRecord): Resource => ({
  id: record.id,
  title: record.title,
  description: record.description,
  categoryId: record.categoryId,
  meta: record.publishedAt.slice(0, 10),
  tag: getCategoryPath(record.categoryId).map((category) => category.name).join(" / "),
  classificationStatus: "classified",
  publicationStatus: "published",
  isPubliclyAccessible: true,
  publishedAt: record.publishedAt,
  ...(record.fileType ? { fileType: record.fileType } : {}),
  ...(record.sizeBytes === null ? {} : { sizeBytes: record.sizeBytes }),
});

/** @deprecated Keep only for local/server-mode compatibility. */
export async function readPublic(
  path: string,
  signal?: AbortSignal,
  timeoutMs = 15_000,
) {
  let response: Response;
  try {
    response = await fetch(`/api/public/resources${path}`, {
      cache: "no-store",
      credentials: "omit",
      signal: AbortSignal.any([
        ...(signal ? [signal] : []),
        AbortSignal.timeout(timeoutMs),
      ]),
    });
  } catch {
    throw new Error("公开资料服务暂不可用，请重试。");
  }
  if (!response.ok) {
    throw new Error(
      response.status === 404
        ? "资料不存在、未发布或已撤回。"
        : "公开资料服务暂不可用，请重试。",
    );
  }
  return response.json().catch(() => {
    throw new Error("公开资料服务暂不可用，请重试。");
  });
}
