import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { Router, RouterModule } from "@angular/router";
import { ClientService } from "@app/core/service/api/client.service";
import { TermoCondicaoService } from "@app/core/service/api/termo-condicao.service";
import { Authentication } from "@app/core/service/auth/autenthication";
import { ToastService } from "@app/core/service/state/toast.service";
import { Client, Role } from "@app/model/client";
import { TermoCondicao } from "@app/model/termo-condicao";
import { PrimengModule } from "@app/shared/primeng/primeng.module";
import { ProgressSpinnerModule } from "primeng/progressspinner";
import { GuestHeaderComponent } from "../components/guest-header/guest-header.component";

@Component({
  selector: "app-terms-of-service",
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    PrimengModule,
    GuestHeaderComponent,
    ProgressSpinnerModule,
  ],
  templateUrl: "./terms-of-service.component.html",
  styleUrls: ["./terms-of-service.component.scss"],
})
export class TermsOfServiceComponent implements OnInit {
  termoCondicao: TermoCondicao | null = null;
  client: Client | null = null;
  loading = true;
  error = false;
  aceitandoTermos = false;

  constructor(
    private readonly termoCondicaoService: TermoCondicaoService,
    private readonly clientService: ClientService,
    private readonly authentication: Authentication,
    private readonly toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit() {
    Promise.all([
      this.carregarTermoCondicao(),
      this.verificarCliente(),
    ]).finally(() => {
      this.loading = false;
    });
  }

  carregarTermoCondicao(): Promise<void> {
    this.error = false;

    return new Promise((resolve, reject) => {
      this.termoCondicaoService.pegarTermoCondicao().subscribe({
        next: (termo) => {
          this.termoCondicao = termo;
          resolve();
        },
        error: (error) => {
          console.error("Error loading terms of use:", error);
          this.error = true;
          reject(error);
        },
      });
    });
  }

  private async verificarCliente(): Promise<void> {
    if (this.isLoggedIn) {
      console.log("Tá logado");
      this.client = this.authentication._clientSignal();
    }
    console.log("Tá deslogado");
  }

  aceitarTermos() {
    if (!this.client?.id) {
      this.toastService.erro("Error: Client not identified");
      return;
    }

    this.aceitandoTermos = true;

    this.clientService.aceitarTermosDeCondicao().subscribe({
      next: () => {
        this.aceitandoTermos = false;
        this.toastService.sucesso("Terms accepted successfully!");

        this.authentication.pegarDadosAutenticado().then(() => {
          this.client = this.authentication._clientSignal();
          if (this.client?.role === Role.ADMIN) {
            this.router.navigate(["/admin"]);
          } else {
            this.router.navigate(["/client"]);
          }
        });
      },
      error: (error) => {
        this.aceitandoTermos = false;
        console.error("Error accepting terms:", error);
        this.toastService.erro("Error accepting terms. Please try again.");
      },
    });
  }

  isLoggedIn(): boolean {
    return this.authentication.isTokenValido();
  }

  shouldShowLoggedInHeader(): boolean {
    return this.isLoggedIn && !this.precisaAceitarTermos;
  }

  shouldShowGuestHeader(): boolean {
    return !this.isLoggedIn;
  }

  precisaAceitarTermos(): boolean {
    console.log("isLoggedIn:", this.isLoggedIn);
    console.log("client:", this.client);
    console.log("termAccepted:", this.client?.termAccepted);
    return this.isLoggedIn && this.client && !this.client.termAccepted;
  }

  get podeAceitarTermos(): boolean {
    return (
      this.precisaAceitarTermos && !this.aceitandoTermos && !!this.termoCondicao
    );
  }
}
