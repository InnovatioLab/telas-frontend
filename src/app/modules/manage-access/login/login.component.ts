import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseModule } from '@app/shared/base/base.module';
import { CardCentralizadoComponent, ErrorComponent } from '@app/shared';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { PrimengModule } from '@app/shared/primeng/primeng.module';
import { DialogoComponent } from '@app/shared/components/dialogo/dialogo.component';
import { DialogoUtils } from '@app/shared/utils/dialogo-config.utils';
import { Client, Role } from '@app/model/client';
import { ILoginRequest } from '@app/model/dto/request/login.request';
import { finalize, catchError, of, firstValueFrom } from 'rxjs';
import { Authentication } from '@app/core/service/auth/autenthication';
import { TermosComponent } from '@app/modules/register/termos-condicoes/termos.component';
import { AutenticacaoService } from '@app/core/service/api/autenticacao.service';
import { ClientService } from '@app/core/service/api/client.service';
import { AuthenticationStorage } from '@app/core/service/auth/authentication-storage';

@Component({
    selector: 'app-login',
    imports: [
      CommonModule, 
      BaseModule, 
      PrimengModule, 
      CardCentralizadoComponent, 
      ErrorComponent, 
      TermosComponent
    ],
    standalone: true,
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  logoSrc: string | undefined;
  exibirTermos = false;
  form: FormGroup;
  ref: DynamicDialogRef | undefined;
  loading = false;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly router: Router,
    public dialogService: DialogService,
    private readonly autenticacaoService: AutenticacaoService,
    private readonly clientService: ClientService,
    private readonly authentication: Authentication
  ) {}

  ngOnInit(): void {
    this.iniciarFormulario();
  }

  onlyNumbersInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/[^0-9]/g, '');
    this.form.get('login').setValue(input.value);
  }

  iniciarFormulario(): void {
    this.form = this.formBuilder.group({
      login: ['', [Validators.required, Validators.pattern(/^\d{1,9}$/)]],
      senha: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(32)]]
    });
  }

  login(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    const { login, senha } = this.form.value;

    const payload: ILoginRequest = {
      username: login, // Usando o valor diretamente sem formatação
      password: senha
    };

    this.autenticacaoService.login(payload)
      .pipe(
        finalize(() => this.loading = false),
        catchError(error => {
          this.mensagemLoginInvalidoDialog();
          return of(null);
        })
      )
      .subscribe(response => {
        if (response) {
          this.authentication.isLoggedIn$.next(true);
          this.verificarTermo();
        }
      });
  }

  async verificarTermo(): Promise<void> {
    this.loading = true;
    try {
      const userId = AuthenticationStorage.getUserId();
      if (!userId) {
        throw new Error('ID do usuário não encontrado');
      }
      
      const client = await firstValueFrom(this.clientService.buscarClient<Client>(userId));
      
      this.authentication.updateClientData(client);
      
      if (client.termAccepted) {
        this.redirecionarParaHome(client);
      } else {
        this.exibirTermos = true;
      }
    } catch (error) {
      console.error('Erro ao verificar aceitação de termos:', error);
      this.mensagemLoginInvalidoDialog('Erro ao verificar seus dados. Por favor, tente novamente.');
      this.logout();
    } finally {
      this.loading = false;
    }
  }

  redirecionarParaHome(client?: Client): void {
    if (!client) {
      client = this.autenticacaoService.user;
      
      if (!client) {
        console.log('Usuário não encontrado, redirecionando para /client');
        this.router.navigate(['/client']);
        return;
      }
    }

    console.log('Papel do usuário:', client.role);
    console.log('É admin?', client.role === Role.ADMIN);

    // Limpar qualquer estado que possa estar impedindo a navegação
    this.exibirTermos = false;
    this.loading = false;

    if (client.role === Role.ADMIN) {
      console.log('Redirecionando admin para /admin');
      this.router.navigate(['/admin']).then(
        success => console.log('Navegação para /admin:', success),
        error => console.error('Erro na navegação para /admin:', error)
      );
    } else {
      console.log('Redirecionando usuário comum para /client');
      this.router.navigate(['/client']);
    }
  }

  respostaTermo(aceito: boolean): void {
    if (aceito) {
      this.aceitarTermos();
    } else {
      this.recusarTermos();
    }
  }

  aceitarTermos(): void {
    this.loading = true;
    this.clientService.aceitarTermosDeCondicao().subscribe({
      next: () => {
        this.loading = false;
        this.exibirTermos = false;
        this.authentication.pegarDadosAutenticado().then(async () => {
          // Força a atualização do estado de autenticação
          this.authentication.isLoggedIn$.next(true);
          
          const userId = AuthenticationStorage.getUserId();
          if (userId) {
            try {
              const client = await firstValueFrom(this.clientService.buscarClient<Client>(userId));
              this.authentication.updateClientData(client);
              this.redirecionarParaHome(client);
            } catch (error) {
              console.error('Erro ao buscar dados do cliente após aceitar termos:', error);
              this.redirecionarParaHome(); 
            }
          } else {
            this.redirecionarParaHome();
          }
        });
      },
      error: (error) => {
        console.error('Erro ao aceitar termos:', error);
        this.loading = false;
        this.mensagemLoginInvalidoDialog('Erro ao aceitar os termos. Por favor, tente novamente.');
      }
    });
  }

  recusarTermos(): void {
    this.logout();
    this.exibirTermos = false;
  }

  logout(): void {
    this.autenticacaoService.logout();
    this.router.navigate(['/login']);
  }

  validarNumeroIdentificacao(numero: string): boolean {
    return /^\d{1,9}$/.test(numero);
  }

  habilitarBotao(): boolean {
    return !this.form.valid || this.loading;
  }

  mensagemLoginInvalidoDialog(mensagem = 'Invalid identification number or password'): void {
    const config = DialogoUtils.criarConfig({
      titulo: 'Invalid!',
      descricao: mensagem,
      icon: 'report',
      acaoPrimaria: 'Back',
      acaoPrimariaCallback: () => {
        this.ref?.close();
      },
    });
    this.ref = this.dialogService.open(DialogoComponent, config);
  }
}
