import type {
  PublicAccessStatus,
  PublicManifestProvider,
} from "./publicManifest";

export type ResourceClassificationStatus = "classified" | "pending";
export type ResourcePublicationStatus = "draft" | "published" | "withdrawn";

export type ResourceDelivery = {
  provider: PublicManifestProvider;
  shareUrl: string | null;
  passcode?: string;
  accessStatus: PublicAccessStatus;
  checkedOn?: string | null;
};

export type Resource = {
  id: string;
  title: string;
  meta: string;
  tag: string;
  description: string;
  categoryId: string | null;
  classificationStatus: ResourceClassificationStatus;
  publicationStatus?: ResourcePublicationStatus;
  isPubliclyAccessible?: boolean;
  publishedAt?: string;
  fileType?: string;
  sizeBytes?: number;
  delivery?: ResourceDelivery;
};

const RESOURCE_SIZE_UNITS = ["B", "KB", "MB", "GB", "TB"] as const;

export function formatResourceSize(
  sizeBytes: number | null | undefined,
): string | null {
  if (
    typeof sizeBytes !== "number" ||
    !Number.isSafeInteger(sizeBytes) ||
    sizeBytes < 0
  ) {
    return null;
  }

  if (sizeBytes === 0) return "0 B";

  const unitIndex = Math.min(
    Math.floor(Math.log(sizeBytes) / Math.log(1024)),
    RESOURCE_SIZE_UNITS.length - 1,
  );
  const value = sizeBytes / 1024 ** unitIndex;
  const displayValue =
    unitIndex === 0 ? String(value) : String(Number(value.toFixed(1)));
  return `${displayValue} ${RESOURCE_SIZE_UNITS[unitIndex]}`;
}

export function getResourceMetadataLabel(
  resource: Pick<Resource, "fileType" | "sizeBytes">,
): string | null {
  const fileType =
    typeof resource.fileType === "string" ? resource.fileType.trim() : "";
  const fileTypeLabel = getResourceFileTypeLabel(fileType);
  const size = formatResourceSize(resource.sizeBytes);
  const labels = [fileTypeLabel, size].filter(
    (label): label is string => Boolean(label),
  );
  return labels.length > 0 ? labels.join(" · ") : null;
}

export function getResourceFileTypeLabel(fileType: string): string {
  const normalized = fileType.trim().toLowerCase();
  if (!normalized) return "";
  if (normalized === "folder" || normalized === "directory") return "文件夹";
  if (normalized === "application/pdf" || normalized === "pdf") return "PDF";
  if (normalized === "application/zip" || normalized === "zip") return "ZIP";
  if (normalized === "application/epub+zip" || normalized === "epub") return "EPUB";
  if (normalized === "application/msword" || normalized === "doc") return "DOC";
  if (
    normalized ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    normalized === "docx"
  ) {
    return "DOCX";
  }
  return fileType.trim();
}

export function getResourceUpdatedTimestamp(
  resource: Pick<Resource, "meta" | "publishedAt">,
): number {
  const timestamp = Date.parse(resource.publishedAt ?? resource.meta);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

export function sortResourcesByUpdatedAt(values: readonly Resource[]): Resource[] {
  return values
    .map((resource, index) => ({ resource, index }))
    .sort((left, right) => {
      const timestampDifference =
        getResourceUpdatedTimestamp(right.resource) -
        getResourceUpdatedTimestamp(left.resource);
      if (timestampDifference !== 0) return timestampDifference;
      const titleDifference = left.resource.title.localeCompare(
        right.resource.title,
        "zh-CN",
      );
      if (titleDifference !== 0) return titleDifference;
      const idDifference = left.resource.id.localeCompare(right.resource.id);
      return idDifference !== 0 ? idDifference : left.index - right.index;
    })
    .map(({ resource }) => resource);
}

export function matchesResourceQuery(resource: Resource, query: string): boolean {
  const normalized = query.trim().toLocaleLowerCase("zh-CN");
  if (!normalized) return true;
  return [resource.title, resource.description, resource.tag]
    .join(" ")
    .toLocaleLowerCase("zh-CN")
    .includes(normalized);
}

export const resources: readonly Resource[] = [
  {
    id: "01",
    title: "2026高考数学真题及答案（全国卷）",
    meta: "2024-12-10",
    tag: "高中",
    description: "全国卷高考数学真题与答案整理。",
    categoryId: null,
    classificationStatus: "pending",
  },
  {
    id: "02",
    title: "大学英语四级高频词汇整理",
    meta: "2024-12-09",
    tag: "大学",
    description: "适合备考四级的高频词汇资料。",
    categoryId: null,
    classificationStatus: "pending",
  },
  {
    id: "03",
    title: "计算机二级Office操作题合集",
    meta: "2024-12-08",
    tag: "考证",
    description: "Office 计算机二级操作题练习合集。",
    categoryId: null,
    classificationStatus: "pending",
  },
  {
    id: "04",
    title: "初中数学知识点总结（全册）",
    meta: "2024-12-06",
    tag: "初中",
    description: "初中数学全册知识点梳理。",
    categoryId: null,
    classificationStatus: "pending",
  },
  {
    id: "05",
    title: "高中物理必修一重点知识整理",
    meta: "2024-12-05",
    tag: "高中",
    description: "高中物理必修一重点知识整理。",
    categoryId: null,
    classificationStatus: "pending",
  },
  {
    id: "06",
    title: "考研英语历年真题及解析",
    meta: "2024-12-04",
    tag: "考证",
    description: "考研英语历年真题与解析。",
    categoryId: null,
    classificationStatus: "pending",
  },
  {
    id: "07",
    title: "公务员考试行测资料合集",
    meta: "2024-12-03",
    tag: "考证",
    description: "公务员行测备考资料合集。",
    categoryId: null,
    classificationStatus: "pending",
  },
  {
    id: "08",
    title: "大学专业课笔记（计算机类）",
    meta: "2024-12-02",
    tag: "大学",
    description: "计算机专业课程笔记整理。",
    categoryId: null,
    classificationStatus: "pending",
  },
  {
    id: "09",
    title: "高中化学实验题专项训练",
    meta: "2024-12-01",
    tag: "高中",
    description: "高中化学实验题专项练习。",
    categoryId: null,
    classificationStatus: "pending",
  },
  {
    id: "10",
    title: "中考英语真题汇总（近五年）",
    meta: "2024-11-30",
    tag: "初中",
    description: "近五年中考英语真题汇总。",
    categoryId: null,
    classificationStatus: "pending",
  },
];
