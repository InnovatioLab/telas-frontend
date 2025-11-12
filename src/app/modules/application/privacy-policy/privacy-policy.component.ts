import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { RouterModule } from "@angular/router";
import { PoliticaPrivacidadeService } from "@app/core/service/api/politica-privacidade.service";
import { Authentication } from "@app/core/service/auth/autenthication";
import { PoliticaPrivacidade } from "@app/model/politica-privacidade";
import { PrimengModule } from "@app/shared/primeng/primeng.module";
import { ProgressSpinnerModule } from "primeng/progressspinner";
import { GuestHeaderComponent } from "../components/guest-header/guest-header.component";

@Component({
  selector: "app-privacy-policy",
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    PrimengModule,
    GuestHeaderComponent,
    ProgressSpinnerModule,
  ],
  templateUrl: "./privacy-policy.component.html",
  styleUrls: ["./privacy-policy.component.scss"],
})
export class PrivacyPolicyComponent implements OnInit {
  politicaPrivacidade: PoliticaPrivacidade | null = null;
  loading = true;
  error = false;

  constructor(
    private readonly politicaPrivacidadeService: PoliticaPrivacidadeService,
    private readonly authentication: Authentication
  ) {}

  ngOnInit() {
    this.carregarPoliticaPrivacidade();
  }

  carregarPoliticaPrivacidade() {
    this.loading = true;
    this.error = false;

    this.politicaPrivacidadeService.pegarPoliticaPrivacidade().subscribe({
      next: (politica) => {
        this.politicaPrivacidade = politica;
        this.loading = false;
      },
      error: (error) => {
        this.error = true;
        this.loading = false;
      },
    });
  }

  get isLoggedIn(): boolean {
    return this.authentication.isTokenValido();
  }

  get shouldShowLoggedInHeader(): boolean {
    return this.isLoggedIn;
  }

  get shouldShowGuestHeader(): boolean {
    return !this.isLoggedIn;
  }
}
