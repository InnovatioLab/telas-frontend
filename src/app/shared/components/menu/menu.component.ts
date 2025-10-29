import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { ClientService } from "@app/core/service/api/client.service";
import { Role } from "@app/model/client";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { AdminMenuSideComponent } from "../admin-menu-side/admin-menu-side.component";
import { ClientMenuSideComponent } from "../client-menu-side/client-menu-side.component";

@Component({
  selector: "app-menu",
  standalone: true,
  imports: [CommonModule, AdminMenuSideComponent, ClientMenuSideComponent],
  template: `
    <app-admin-menu-side *ngIf="isAdministrador$ | async"></app-admin-menu-side>
    <app-client-menu-side
      *ngIf="!(isAdministrador$ | async)"
    ></app-client-menu-side>
  `,
  styles: [],
})
export class MenuComponent {
  private readonly clientService = inject(ClientService);

  // Usa o clientAtual$ (BehaviorSubject) do ClientService para evitar
  // requisições redundantes. Esse subject é atualizado a partir do
  // Authentication.updateClientData / pegarDadosAutenticado.
  readonly isAdministrador$: Observable<boolean> =
    this.clientService.clientAtual$.pipe(
      map((client) => client?.role === Role.ADMIN)
    );
}
