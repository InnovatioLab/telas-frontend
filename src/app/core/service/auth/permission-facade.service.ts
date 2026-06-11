import { inject, Injectable } from '@angular/core';
import { Role } from '@app/model/client';
import { hasMonitoringPermission } from '@app/core/utils/monitoring-permission.util';
import { canAdminCreatePartner } from '@app/core/utils/admin-partner.util';
import { Authentication } from './autenthication';

@Injectable({ providedIn: 'root' })
export class PermissionFacadeService {
  private readonly authentication = inject(Authentication);

  can(code: string): boolean {
    const client = this.authentication.client();
    if (!client?.role) return false;
    if (client.role === Role.DEVELOPER) return true;
    if (client.role === Role.ADMIN) {
      const perms = client.permissions;
      if (!perms || perms.length === 0) return true;
      return perms.includes(code);
    }
    return false;
  }

  hasMonitoring(code: string): boolean {
    return hasMonitoringPermission(this.authentication.client(), code);
  }

  isDeveloper(): boolean {
    return this.authentication.client()?.role === Role.DEVELOPER;
  }

  isAdmin(): boolean {
    return this.authentication.client()?.role === Role.ADMIN;
  }

  isPrivileged(): boolean {
    return this.isDeveloper() || this.isAdmin();
  }

  canCreatePartner(): boolean {
    return canAdminCreatePartner(this.authentication.client());
  }
}
