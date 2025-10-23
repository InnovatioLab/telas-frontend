import { Injectable } from "@angular/core";
import { CanActivate, Router } from "@angular/router";
import { Role } from "@app/model/client";
import { firstValueFrom } from "rxjs";
import { ClientService } from "../api/client.service";
import { Authentication } from "../auth/autenthication";

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
    if (!this.authentication.isTokenValido()) {
      this.router.navigate(["/login"]);
      return false;
    }

    const authenticatedClient = await firstValueFrom(
      this.clientService.getAuthenticatedClient()
    );
    const userRole = authenticatedClient?.role;

    if (userRole === Role.ADMIN) {
      this.router.navigate(["/admin"]);
      return false;
    }

    return true;
  }
}
