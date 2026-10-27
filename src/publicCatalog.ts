import { useEffect, useState } from "react";
import {
  categories,
  getCategoryPath,
  type Category,
} from "./categories";
import {
  getPublishedResourceCount,
  isPublishedPublicResource,
} from "./categoryCounts";
import {
  isAllowedPublicShareUrl,
  loadPublicManifest,
  PUBLIC_PROVIDERS,
  type PublicAccessStatus,
  type PublicManifestProvider,
  type PublicManifestRecord,
} from "./publicManifest";
import type { Resource } from "./resources";

export type PublicCatalogPhase = "loading" | "ready" | "error";

export type PublicCatalogState = {
  phase: PublicCatalogPhase;
  items: Resource[];
  counts: Record<string, number>;
  status: string;
};

const initialState: PublicCatalogState = {
  phase: "loading",
  items: [],
  counts: {},
  status: "正在加载公开资料清单…",
};

const isManifestProvider = (
  value: unknown,
): value is PublicManifestProvider =>
  (PUBLIC_PROVIDERS as readonly unknown[]).includes(value);

export const mapManifestRecordToResource = (
  record: PublicManifestRecord,
  categoryValues: readonly Category[] = categories,
): Resource => {
  const categoryPath = getCategoryPath(record.categoryId, categoryValues);
  const shareUrl =
    isManifestProvider(record.provider) &&
    isAllowedPublicShareUrl(record.provider, record.shareUrl)
      ? record.shareUrl
      : null;

  return {
    id: record.id,
    title: record.title,
    description: record.description ?? "",
    categoryId: record.categoryId,
    meta: record.publishedAt.slice(0, 10),
    tag: categoryPath.map((category) => category.name).join(" / "),
    classificationStatus: "classified",
    publicationStatus:
      record.accessStatus === "withdrawn"
        ? "withdrawn"
        : record.accessStatus === "verified"
          ? "published"
          : "draft",
    isPubliclyAccessible: record.accessStatus === "verified",
    publishedAt: record.publishedAt,
    ...(record.fileType ? { fileType: record.fileType } : {}),
    ...(record.sizeBytes === undefined ? {} : { sizeBytes: record.sizeBytes }),
    delivery: {
      provider: record.provider,
      shareUrl,
      ...(record.passcode === undefined ? {} : { passcode: record.passcode }),
      accessStatus: record.accessStatus,
      checkedOn: record.checkedOn ?? null,
    },
  };
};

export const ACCESS_STATUS_LABELS: Readonly<
  Record<PublicAccessStatus, string>
> = {
  unchecked: "尚未核验",
  verified: "已核验",
  degraded: "访问异常",
  expired: "已确认失效",
  withdrawn: "已撤回",
};

export const ACCESS_STATUS_MESSAGES: Readonly<
  Record<PublicAccessStatus, string>
> = {
  unchecked: "链接尚未人工核验，请打开后留意网盘页面提示。",
  verified: "该链接已由人工在最近核验日期检查。链接状态不会永久有效。",
  degraded: "访问状态异常或不确定，暂不提供正常访问入口。",
  expired: "该分享已确认失效，暂不提供正常访问入口。",
  withdrawn: "该资料已撤回，不再提供正常公开访问入口。",
};

export const getResourceAccessStatus = (
  resource: Resource,
): PublicAccessStatus | null => resource.delivery?.accessStatus ?? null;

export const getResourceAccessLabel = (resource: Resource) => {
  const status = getResourceAccessStatus(resource);
  return status ? ACCESS_STATUS_LABELS[status] : null;
};

export const getResourceAccessMessage = (resource: Resource) => {
  const status = getResourceAccessStatus(resource);
  return status ? ACCESS_STATUS_MESSAGES[status] : null;
};

export const canOpenPublicShare = (resource: Resource) => {
  return isPublishedPublicResource(resource);
};

const buildCategoryCounts = (
  items: readonly Resource[],
  categoryValues: readonly Category[] = categories,
) =>
  Object.fromEntries(
    categoryValues.map((category) => [
      category.id,
      getPublishedResourceCount(category.id, categoryValues, items),
    ]),
  );

export function usePublicCatalog(): PublicCatalogState {
  const [state, setState] = useState<PublicCatalogState>(initialState);

  useEffect(() => {
    let active = true;
    void loadPublicManifest()
      .then((manifest) => {
        if (!active) return;
        const items = manifest.records.map((record) =>
          mapManifestRecordToResource(record),
        );
        setState({
          phase: "ready",
          items,
          counts: buildCategoryCounts(items),
          status: "",
        });
      })
      .catch(() => {
        if (!active) return;
        setState({
          phase: "error",
          items: [],
          counts: {},
          status: "公开资料清单暂不可用，请重试。",
        });
      });

    return () => {
      active = false;
    };
  }, []);

  return state;
}
