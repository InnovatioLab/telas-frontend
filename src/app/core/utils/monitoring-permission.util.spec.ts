import { Role } from "@app/model/client";
import { MonitoringPermission } from "@app/model/monitoring-permission";
import { hasMonitoringPermission } from "./monitoring-permission.util";

describe("hasMonitoringPermission", () => {
  it("grants all permissions to developer", () => {
    expect(
      hasMonitoringPermission(
        { role: Role.DEVELOPER, permissions: [] },
        MonitoringPermission.ADMIN_CLIENTS_PERMANENT_DELETE
      )
    ).toBe(true);
  });

  it("grants all permissions to admin with empty permission list", () => {
    expect(
      hasMonitoringPermission(
        { role: Role.ADMIN, permissions: [] },
        MonitoringPermission.ADMIN_CLIENTS_PERMANENT_DELETE
      )
    ).toBe(true);
  });

  it("checks explicit permission for admin with grants", () => {
    expect(
      hasMonitoringPermission(
        {
          role: Role.ADMIN,
          permissions: [MonitoringPermission.ADMIN_CLIENTS_SOFT_DELETE],
        },
        MonitoringPermission.ADMIN_CLIENTS_PERMANENT_DELETE
      )
    ).toBe(false);
    expect(
      hasMonitoringPermission(
        {
          role: Role.ADMIN,
          permissions: [MonitoringPermission.ADMIN_CLIENTS_SOFT_DELETE],
        },
        MonitoringPermission.ADMIN_CLIENTS_SOFT_DELETE
      )
    ).toBe(true);
  });
});
