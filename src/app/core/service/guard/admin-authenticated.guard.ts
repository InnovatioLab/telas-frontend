import { Injectable } from "@angular/core";
import { CanActivate, Router } from "@angular/router";
import { Client, isPrivilegedPanelRole } from "@app/model/client";
import { firstValueFrom, of } from "rxjs";
import { catchError } from "rxjs/operators";
import { ClientService } from "../api/client.service";
import { Authentication } from "../auth/autenthication";
import { AuthenticationStorage } from "../auth/authentication-storage";

@Injectable({
  providedIn: "root",
})
export class AdminAuthenticatedGuard implements CanActivate {
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
      this.clientService.getAuthenticatedClient().pipe(catchError(() => of(null)))
    );

    if (!authenticatedClient) {
      this.router.navigate(["/login"]);
      return false;
    }

    if (!isPrivilegedPanelRole(authenticatedClient.role)) {
      this.router.navigate(["/client"]);
      return false;
    }

    this.authentication.updateClientData(authenticatedClient as unknown as Client);

    return true;
  }
}
