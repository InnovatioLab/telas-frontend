import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { Authentication } from "@app/core/service/auth/autenthication";
import { AdminMenuSideComponent } from "../admin-menu-side/admin-menu-side.component";
import { ClientMenuSideComponent } from "../client-menu-side/client-menu-side.component";

@Component({
  selector: "app-menu",
  standalone: true,
  imports: [CommonModule, AdminMenuSideComponent, ClientMenuSideComponent],
  template: `
    <app-admin-menu-side *ngIf="isAdministrador"></app-admin-menu-side>
    <app-client-menu-side *ngIf="!isAdministrador"></app-client-menu-side>
  `,
  styles: []
})
export class MenuComponent {
  private readonly authentication = inject(Authentication);

  get isAdministrador(): boolean {
    return this.authentication.isAdministrador();
  }
}
