import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ClientService } from '@app/core/service/api/client.service';
import { TermoCondicaoService } from '@app/core/service/api/termo-condicao.service';
import { Authentication } from '@app/core/service/auth/autenthication';
import { ToastService } from '@app/core/service/state/toast.service';
import { Client } from '@app/model/client';
import { TermoCondicao } from '@app/model/termo-condicao';
import { HeaderComponent } from '@app/shared/components/header/header.component';
import { PrimengModule } from '@app/shared/primeng/primeng.module';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { GuestHeaderComponent } from '../components/guest-header/guest-header.component';

@Component({
  selector: 'app-terms-of-service',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    PrimengModule,
    HeaderComponent,
    GuestHeaderComponent,
    ProgressSpinnerModule,
  ],
  templateUrl: './terms-of-service.component.html',
  styleUrls: ['./terms-of-service.component.scss']
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
    private readonly toastService: ToastService
  ) {}

  ngOnInit() {
    this.carregarTermoCondicao();
    this.verificarCliente();
  }

  carregarTermoCondicao() {
    this.loading = true;
    this.error = false;

    this.termoCondicaoService.pegarTermoCondicao().subscribe({
      next: (termo) => {
        this.termoCondicao = termo;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erro ao carregar termos de uso:', error);
        this.error = true;
        this.loading = false;
      }
    });
  }

  private verificarCliente() {
    if (this.isLoggedIn) {
      this.authentication.pegarDadosAutenticado().then(() => {
        this.client = this.authentication._clientSignal();
      });
    }
  }

  aceitarTermos() {
    if (!this.client?.id) {
      this.toastService.erro('Erro: Cliente não identificado');
      return;
    }

    this.aceitandoTermos = true;
    
    this.clientService.aceitarTermosDeCondicao().subscribe({
      next: () => {
        this.aceitandoTermos = false;
        this.toastService.sucesso('Termos aceitos com sucesso!');
        
        // Atualizar dados do cliente
        this.authentication.pegarDadosAutenticado().then(() => {
          this.client = this.authentication._clientSignal();
        });
      },
      error: (error) => {
        this.aceitandoTermos = false;
        console.error('Erro ao aceitar termos:', error);
        this.toastService.erro('Erro ao aceitar os termos. Tente novamente.');
      }
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

  get precisaAceitarTermos(): boolean {
    return this.isLoggedIn && 
           this.client && 
           (!this.client.termAccepted || !this.client.termCondition);
  }

  get podeAceitarTermos(): boolean {
    return this.isLoggedIn && this.client && !this.aceitandoTermos;
  }
}
