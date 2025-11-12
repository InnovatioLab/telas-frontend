import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { Router, RouterModule } from "@angular/router";
import { ConfirmDialogModule } from "primeng/confirmdialog";
import { DialogService, DynamicDialogRef } from "primeng/dynamicdialog";
import { ToastModule } from "primeng/toast";
import { catchError, of } from "rxjs";
import { switchMap, take } from "rxjs/operators";
import packageJson from "../../package.json";
import { ClientService } from "./core/service/api/client.service";
import { Authentication } from "./core/service/auth/autenthication";
import { AuthenticationStorage } from "./core/service/auth/authentication-storage";
import { Client } from "./model/client";
import { DotsLoadingComponent } from "./shared/components/dots-loading/dots-loading.component";
import { ToastComponent } from "./shared/components/toast/toast.component";
import { PrimengModule } from "./shared/primeng/primeng.module";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [
    CommonModule,
    PrimengModule,
    RouterModule,
    ToastModule,
    ConfirmDialogModule,
    ToastComponent,
    DotsLoadingComponent,
  ],
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
})
export class AppComponent implements OnInit {
  title = "Telas";
  public version: string = packageJson.version;
  ref: DynamicDialogRef | undefined;

  constructor(
    private readonly router: Router,
    public dialogService: DialogService,
    private readonly authentication: Authentication,
    private readonly clientService: ClientService
  ) {}

  ngOnInit(): void {
    this.verificarAutoLogin();
  }

  verificarAutoLogin(): void {
    const token = AuthenticationStorage.getToken();
    if (!token) return;

    if (!this.authentication.isTokenValido()) {
      this.authentication.removerAutenticacao();
      this.router.navigate(["/login"]);
      return;
    }

    this.clientService.clientAtual$
      .pipe(
        take(1),
        switchMap((client) =>
          client ? of(client) : this.clientService.getAuthenticatedClient()
        ),
        catchError((error) => {
          this.authentication.removerAutenticacao();
          this.router.navigate(["/login"]);
          return of(null);
        })
      )
      .subscribe((authenticatedClient) => {
        if (!authenticatedClient) return;

        this.authentication.updateClientData(authenticatedClient as Client);

        if (!authenticatedClient.termAccepted) {
          this.router.navigate(["/terms-of-service"]);
        }
      });
  }
}
