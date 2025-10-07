import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { Router, RouterModule } from "@angular/router";
import { AutenticacaoService } from "@app/core/service/api/autenticacao.service";
import { ClientService } from "@app/core/service/api/client.service";
import { TermoCondicaoService } from "@app/core/service/api/termo-condicao.service";
import { Authentication } from "@app/core/service/auth/autenthication";
import { ToastService } from "@app/core/service/state/toast.service";
import { Role } from "@app/model/client";
import { AuthenticatedClientResponseDto } from "@app/model/dto/response/authenticated-client-response.dto";
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
  client: AuthenticatedClientResponseDto | null = null;
  loading = true;
  error = false;
  aceitandoTermos = false;
  precisaAceitarTermos = false;

  constructor(
    private readonly termoCondicaoService: TermoCondicaoService,
    private readonly clientService: ClientService,
    private readonly autenticacaoService: AutenticacaoService,
    private readonly authentication: Authentication,
    private readonly toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.carregarTermoCondicao();
    this.client = this.autenticacaoService.loggedClient;
    this.precisaAceitarTermos = this.client ? !this.client.termAccepted : false;
  }

  carregarTermoCondicao(): void {
    this.termoCondicaoService.pegarTermoCondicao().subscribe({
      next: (termo) => {
        this.termoCondicao = termo;
      },
      error: (error) => {
        this.handleError("Erro ao carregar termos de uso.", error);
      },
      complete: () => {
        this.loading = false;
      },
    });
  }

  aceitarTermos(): void {
    if (!this.client?.id) {
      this.toastService.erro("Erro: Cliente não identificado");
      return;
    }

    this.aceitandoTermos = true;
    this.clientService.aceitarTermosDeCondicao().subscribe({
      next: () => {
        this.aceitandoTermos = false;
        this.toastService.sucesso("Termos aceitos com sucesso!");
        this.navigateAfterAccept();
      },
      error: (error) => {
        this.aceitandoTermos = false;
        this.handleError("Erro ao aceitar os termos. Tente novamente.", error);
      },
    });
  }

  isLoggedIn(): boolean {
    return this.authentication.isTokenValido();
  }

  shouldShowLoggedInHeader(): boolean {
    return this.isLoggedIn() && !this.precisaAceitarTermos;
  }

  shouldShowGuestHeader(): boolean {
    return !this.isLoggedIn();
  }

  private handleError(message: string, error: any): void {
    this.error = true;
    console.error(message, error);
    this.toastService.erro(message);
  }

  private navigateAfterAccept(): void {
    const route = this.client?.role === Role.ADMIN ? "/admin" : "/client";
    this.router.navigate([route]);
  }
}
