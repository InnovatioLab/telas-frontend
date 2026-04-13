import { Injectable } from "@angular/core";
import { CanActivate, Router, UrlTree } from "@angular/router";
import { ClientService } from "@app/core/service/api/client.service";
import { Role } from "@app/model/client";
import { AuthenticatedClientResponseDto } from "@app/model/dto/response/authenticated-client-response.dto";
import { firstValueFrom, of, switchMap, take } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class DeveloperGuard implements CanActivate {
  constructor(
    private readonly clientService: ClientService,
    private readonly router: Router
  ) {}

  async canActivate(): Promise<boolean | UrlTree> {
    const client = await firstValueFrom(
      this.clientService.clientAtual$.pipe(
        take(1),
        switchMap((c) =>
          c
            ? of(c)
            : this.clientService.getAuthenticatedClient()
        )
      )
    );
    const role = (client as AuthenticatedClientResponseDto | null)?.role;
    if (role === Role.DEVELOPER) {
      return true;
    }
    this.router.navigate(["/admin"]);
    return false;
  }
}
