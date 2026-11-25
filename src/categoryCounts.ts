import { categories, getEnabledCategoryPath, type Category } from "./categories";
import { isAllowedPublicShareUrl } from "./publicManifest";
import { type Resource } from "./resources";

// Some already-published university certification records predate the current
// purpose-based certification tree. Keep their stable resource/category IDs,
// but expose them through the current certification routes as a compatibility
// view instead of duplicating or reclassifying the records.
const PURPOSE_CERTIFICATION_COMPATIBLE_RESOURCE_CATEGORIES: Readonly<
  Record<string, readonly string[]>
> = {
  "purpose-certification": [
    "domain-university-certification",
    "domain-university-certification-ielts",
    "domain-university-certification-computer",
    "domain-university-certification-cet",
  ],
  "purpose-certification-ielts": ["domain-university-certification-ielts"],
  "purpose-certification-computer": ["domain-university-certification-computer"],
  "purpose-certification-cet": ["domain-university-certification-cet"],
  "purpose-certification-university": ["domain-university-certification"],
};

/**
 * Return the stable resource IDs that should be displayed for a current
 * category route. Legacy university certification records remain stored under
 * their original IDs, while the current UI exposes them under 考证.
 */
export const getCompatibleResourceCategoryIds = (
  categoryId: string,
): readonly string[] => [
  categoryId,
  ...(PURPOSE_CERTIFICATION_COMPATIBLE_RESOURCE_CATEGORIES[categoryId] ?? []).filter(
    (compatibleId) => compatibleId !== categoryId,
  ),
];

const resourceBelongsToCategory = (
  resourceCategoryId: string,
  categoryId: string,
  categoryValues: readonly Category[],
) => {
  if (
    getEnabledCategoryPath(resourceCategoryId, categoryValues).some(
      (category) => category.id === categoryId,
    )
  ) {
    return true;
  }

  return getCompatibleResourceCategoryIds(categoryId).includes(resourceCategoryId);
};

export const isPublishedPublicResource = (
  resource: Resource,
  categoryValues: readonly Category[] = categories,
) => {
  if (
    resource.classificationStatus !== "classified" ||
    resource.publicationStatus !== "published" ||
    resource.isPubliclyAccessible !== true ||
    resource.delivery?.accessStatus !== "verified" ||
    !resource.categoryId
  ) {
    return false;
  }

  const delivery = resource.delivery;
  if (
    !delivery ||
    (delivery.shareUrl !== null &&
      !isAllowedPublicShareUrl(delivery.provider, delivery.shareUrl))
  ) {
    return false;
  }

  return getEnabledCategoryPath(resource.categoryId, categoryValues).length > 0;
};

export const getPublishedResourcesForCategory = (
  categoryId: string,
  categoryValues: readonly Category[] = categories,
  resourceValues: readonly Resource[] = [],
) => {
  if (getEnabledCategoryPath(categoryId, categoryValues).length === 0) return [];
  return resourceValues.filter(
    (resource) =>
      isPublishedPublicResource(resource, categoryValues) &&
      resourceBelongsToCategory(resource.categoryId!, categoryId, categoryValues),
  );
};

export const getPublishedResourceCount = (
  categoryId: string,
  categoryValues: readonly Category[] = categories,
  resourceValues: readonly Resource[] = [],
) => getPublishedResourcesForCategory(categoryId, categoryValues, resourceValues).length;
