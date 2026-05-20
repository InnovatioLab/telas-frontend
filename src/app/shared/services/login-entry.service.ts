import { Injectable } from "@angular/core";
import { Router } from "@angular/router";

export type LoginEntryMode = "client" | "partner";

@Injectable({
  providedIn: "root",
})
export class LoginEntryService {
  constructor(private readonly router: Router) {}

  navigateToLogin(mode: LoginEntryMode): void {
    this.router.navigate(["/auth/login"], {
      queryParams: { mode },
    });
  }
}
