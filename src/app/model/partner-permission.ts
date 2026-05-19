export const PartnerPermission = {
  PARTNER_SLOTS_ANY_LOCATION: "PARTNER_SLOTS_ANY_LOCATION",
} as const;

export type PartnerPermissionCode =
  (typeof PartnerPermission)[keyof typeof PartnerPermission];
