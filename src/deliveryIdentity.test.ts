import { describe, expect, it } from "vitest";
import {
  assertFormalDeliveryIdAvailable,
  isLegacyV1CompatDeliveryId,
  LEGACY_V1_COMPAT_DELIVERY_ID_PREFIX,
  validateFormalDeliveryId,
} from "./deliveryIdentity";
import {
  B2_3_APPROVED_RESOURCE_IDS,
  deliveryIdFor,
} from "../scripts/b2-3-authorization-policy";

describe("Delivery ID namespace boundaries", () => {
  it("rejects formal IDs that reuse the historical v1 compatibility namespace", () => {
    expect(isLegacyV1CompatDeliveryId(`${LEGACY_V1_COMPAT_DELIVERY_ID_PREFIX}future`)).toBe(true);
    expect(validateFormalDeliveryId("  v1-primary:future  ")).toEqual({
      ok: false,
      code: "reserved-legacy-v1-compatibility-namespace",
      message: "正式 Delivery ID 不得复用保留兼容命名空间：v1-primary:",
    });
    expect(() => assertFormalDeliveryIdAvailable("v1-primary:future")).toThrow(
      "保留兼容命名空间",
    );
    expect(validateFormalDeliveryId("delivery:future")).toEqual({
      ok: true,
      normalized: "delivery:future",
    });
  });

  it("keeps the current local compatibility IDs unique and scoped to approved resources", () => {
    const compatibilityIds = B2_3_APPROVED_RESOURCE_IDS.map(deliveryIdFor);
    expect(new Set(compatibilityIds).size).toBe(B2_3_APPROVED_RESOURCE_IDS.length);
    expect(compatibilityIds.every(isLegacyV1CompatDeliveryId)).toBe(true);
  });
});
