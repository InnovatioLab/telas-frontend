import { Injectable } from "@angular/core";
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  UrlTree,
} from "@angular/router";
import { ClientService } from "@app/core/service/api/client.service";
import { hasMonitoringPermission } from "@app/core/utils/monitoring-permission.util";
import { Client, Role } from "@app/model/client";
import { AuthenticatedClientResponseDto } from "@app/model/dto/response/authenticated-client-response.dto";
import { firstValueFrom, of, switchMap, take } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class MonitoringPermissionGuard implements CanActivate {
  constructor(
    private readonly clientService: ClientService,
    private readonly router: Router
  ) {}

  async canActivate(route: ActivatedRouteSnapshot): Promise<boolean | UrlTree> {
    const permission = route.data["permission"] as string | undefined;
    const permissionsAny = route.data["permissionsAny"] as string[] | undefined;

    const client = await this.loadPanelClient();
    if (!client?.role || (client.role !== Role.ADMIN && client.role !== Role.DEVELOPER)) {
      this.router.navigate(["/client"]);
      return false;
    }

    if (client.role === Role.DEVELOPER) {
      return true;
    }

    if (permissionsAny && permissionsAny.length > 0) {
      const ok = permissionsAny.some((p) => hasMonitoringPermission(client, p));
      if (ok) {
        return true;
      }
      this.router.navigate(["/admin"]);
      return false;
    }

    if (!permission) {
      return true;
    }

    if (hasMonitoringPermission(client, permission)) {
      return true;
    }

    this.router.navigate(["/admin"]);
    return false;
  }

  private async loadPanelClient(): Promise<
    Client | AuthenticatedClientResponseDto | null
  > {
    return firstValueFrom(
      this.clientService.clientAtual$.pipe(
        take(1),
        switchMap((c) =>
          c ? of(c) : this.clientService.getAuthenticatedClient()
        )
      )
    );
  }
}
