/**
 * Reserved only for the local compatibility projection of historical v1
 * records. Formal Delivery IDs must never use this namespace.
 */
export const LEGACY_V1_COMPAT_DELIVERY_ID_PREFIX = "v1-primary:" as const;

export const isLegacyV1CompatDeliveryId = (deliveryId: string) =>
  deliveryId.startsWith(LEGACY_V1_COMPAT_DELIVERY_ID_PREFIX);

export type FormalDeliveryIdValidation =
  | { ok: true; normalized: string }
  | {
      ok: false;
      code: "empty" | "reserved-legacy-v1-compatibility-namespace";
      message: string;
    };

/**
 * Boundary rule for future formal Delivery IDs. This does not validate a
 * provider's external ID format; it only prevents namespace reuse.
 */
export const validateFormalDeliveryId = (
  deliveryId: string,
): FormalDeliveryIdValidation => {
  const normalized = deliveryId.trim();
  if (!normalized) {
    return {
      ok: false,
      code: "empty",
      message: "正式 Delivery ID 不能为空。",
    };
  }
  if (isLegacyV1CompatDeliveryId(normalized)) {
    return {
      ok: false,
      code: "reserved-legacy-v1-compatibility-namespace",
      message: `正式 Delivery ID 不得复用保留兼容命名空间：${LEGACY_V1_COMPAT_DELIVERY_ID_PREFIX}`,
    };
  }
  return { ok: true, normalized };
};

export const assertFormalDeliveryIdAvailable = (deliveryId: string) => {
  const validation = validateFormalDeliveryId(deliveryId);
  if (!validation.ok) throw new Error(validation.message);
  return validation.normalized;
};
