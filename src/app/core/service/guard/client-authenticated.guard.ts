import { Injectable } from "@angular/core";
import { CanActivate, Router } from "@angular/router";
import { Role } from "@app/model/client";
import { firstValueFrom, of } from "rxjs";
import { switchMap, take } from "rxjs/operators";
import { ClientService } from "../api/client.service";
import { Authentication } from "../auth/autenthication";
import { AuthenticationStorage } from "../auth/authentication-storage";

@Injectable({
  providedIn: "root",
})
export class ClientAuthenticatedGuard implements CanActivate {
  constructor(
    private readonly authentication: Authentication,
    private readonly clientService: ClientService,
    private readonly router: Router
  ) {}

  async canActivate() {
    const token = AuthenticationStorage.getToken();

    if (!token || !this.authentication.isTokenValido()) {
      this.router.navigate(["/login"]);
      return false;
    }

    const authenticatedClient = await firstValueFrom(
      this.clientService.clientAtual$.pipe(
        take(1),
        switchMap((client) =>
          client ? of(client) : this.clientService.getAuthenticatedClient()
        )
      )
    );
    const userRole = authenticatedClient?.role;

    if (userRole === Role.ADMIN) {
      this.router.navigate(["/admin"]);
      return false;
    }

    return true;
  }
}
