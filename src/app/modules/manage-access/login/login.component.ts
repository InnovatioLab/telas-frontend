import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseModule } from '@app/shared/base/base.module';
import { CardCentralizadoComponent, ErrorComponent } from '@app/shared';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { validatorCpf } from '@app/utility/src/lib/validators';
import { NgxMaskDirective } from 'ngx-mask';
import { Router } from '@angular/router';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { PrimengModule } from '@app/shared/primeng/primeng.module';
import { AutenticacaoService } from '@app/core/service/autenticacao.service';
import { DialogoComponent } from '@app/shared/components/dialogo/dialogo.component';
import { DialogoUtils } from '@app/shared/utils/dialogo-config.utils';
import { ClientService } from '@app/core/service/client.service';
import { TermosComponent } from '@app/shared/components/termos/termos.component';
import { Client, Role } from '@app/model/client';
import { ILoginRequest } from '@app/model/dto/request/login.request';
import { finalize, catchError, of, firstValueFrom } from 'rxjs';
import { Authentication } from '@app/core/service/autenthication';

@Component({
    selector: 'app-login',
    imports: [
      CommonModule, 
      BaseModule, 
      PrimengModule, 
      CardCentralizadoComponent, 
      ErrorComponent, 
      NgxMaskDirective,
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

  get isMobile(): boolean {
    return window.innerWidth <= 768;
  }

  iniciarFormulario(): void {
    this.form = this.formBuilder.group({
      login: ['', [Validators.required, validatorCpf]],
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
      username: this.formatarCpf(login),
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
          this.verificarTermo();
        }
      });
  }

  async verificarTermo(): Promise<void> {
    this.loading = true;
    try {
      const client = await this.authentication.pegarDadosAutenticado();
      console.log('Cliente autenticado:', client);
      if (client.termAccepted) {
        this.redirecionarParaHome(client);
      } else {
        this.exibirTermos = true;
      }
    } catch (error) {
      console.error('Erro ao buscar dados do cliente:', error);
      this.mensagemLoginInvalidoDialog('Ocorreu um erro ao verificar seus dados. Por favor, tente novamente.');
      this.logout();
    } finally {
      this.loading = false;
    }
  }

  redirecionarParaHome(client: Client): void {
    if (client.role === Role.ADMIN) {
      this.router.navigate(['/admin']);
    } else {
      this.router.navigate(['/home']);
    }
  }

  respostaTermo(aceitou: boolean): void {
    if (aceitou) {
      this.aceitarTermos();
    } else {
      this.recusarTermos();
    }
  }

  aceitarTermosHandler(): void {
    this.aceitarTermos();
  }

  recusarTermosHandler(): void {
    this.recusarTermos();
  }

  async aceitarTermos(): Promise<void> {
    this.exibirTermos = false;
    this.loading = true;
    try {
      await firstValueFrom(this.clientService.aceitarTermosDeCondicao());
      const client = await this.authentication.pegarDadosAutenticado();
      if (client) {
        this.redirecionarParaHome(client);
      }
    } catch (error) {
      console.error('Erro ao aceitar termos:', error);
      this.mensagemLoginInvalidoDialog('Ocorreu um erro ao aceitar os termos. Por favor, tente novamente.');
    } finally {
      this.loading = false;
    }
  }

  recusarTermos(): void {
    this.exibirTermos = false;
    this.logout();
  }

  logout(): void {
    this.autenticacaoService.logout();
    this.router.navigate(['/login']);
  }

  formatarCpf(cpf: string): string {
    return cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  }

  habilitarBotao(): boolean {
    return !this.form.valid || this.loading;
  }

  mensagemLoginInvalidoDialog(mensagem = 'Invalid username or password'): void {
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
