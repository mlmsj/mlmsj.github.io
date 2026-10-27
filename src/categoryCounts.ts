import { categories, getEnabledCategoryPath, type Category } from "./categories";
import { isAllowedPublicShareUrl } from "./publicManifest";
import { type Resource } from "./resources";

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
  if (!delivery || !isAllowedPublicShareUrl(delivery.provider, delivery.shareUrl)) {
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
      getEnabledCategoryPath(resource.categoryId!, categoryValues).some(
        (category) => category.id === categoryId,
      ),
  );
};

export const getPublishedResourceCount = (
  categoryId: string,
  categoryValues: readonly Category[] = categories,
  resourceValues: readonly Resource[] = [],
) => getPublishedResourcesForCategory(categoryId, categoryValues, resourceValues).length;
