import { PartnerPermission } from "@app/model/partner-permission";
import { Role } from "@app/model/client";

export interface PartnerPermissionClient {
  role?: Role | string;
  permissions?: string[];
}

export function hasPartnerGlobalSlotsPermission(
  client: PartnerPermissionClient | null | undefined
): boolean {
  if (!client || client.role !== Role.PARTNER) {
    return false;
  }
  const permissions = client.permissions;
  if (!permissions || permissions.length === 0) {
    return false;
  }
  return permissions.includes(PartnerPermission.PARTNER_SLOTS_ANY_LOCATION);
}

export const PARTNER_FOREIGN_MONITOR_BLOCK_QUANTITY = 5;

export function resolvePartnerCartBlockQuantity(
  client: PartnerPermissionClient | null | undefined
): number {
  return hasPartnerGlobalSlotsPermission(client)
    ? PARTNER_FOREIGN_MONITOR_BLOCK_QUANTITY
    : 1;
}
