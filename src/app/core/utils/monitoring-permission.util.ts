import { Role } from "@app/model/client";

export interface PanelClientPermissions {
  role?: string;
  permissions?: string[];
}

export function hasMonitoringPermission(
  client: PanelClientPermissions | null | undefined,
  code: string
): boolean {
  if (!client?.role) {
    return false;
  }
  if (client.role === Role.DEVELOPER) {
    return true;
  }
  if (client.role === Role.ADMIN) {
    const permissions = client.permissions;
    if (!permissions || permissions.length === 0) {
      return true;
    }
    return permissions.includes(code);
  }
  return false;
}
