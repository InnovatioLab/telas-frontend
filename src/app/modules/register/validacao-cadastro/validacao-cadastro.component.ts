import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  CardCentralizadoComponent,
  DialogoComponent,
  ErrorComponent,
  PrimengModule,
  TermosComponent
} from '@raizes-cearenses-nx/shared-ui';
import { DialogoUtils, MENSAGENS, TEXTO_ACAO } from '@raizes-cearenses-nx/utility';
import { CadastrarSenhaComponent } from '../cadastrar-senha/cadastrar-senha.component';
import { ClientService } from '@raizes-cearenses-nx/user';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Authentication, AuthenticationService } from '@raizes-cearenses-nx/authentication-data-access';
import { CAMPOS_REGEX } from '@raizes-cearenses-nx/produto';

@Component({
  selector: 'feat-validacao-cadastro',
  standalone: true,
  imports: [
    CommonModule,
    PrimengModule,
    CardCentralizadoComponent,
    ErrorComponent,
    CadastrarSenhaComponent,
    TermosComponent,
  ],
  providers: [DialogService],
  templateUrl: './validacao-cadastro.component.html',
  styleUrl: './validacao-cadastro.component.scss'
})
export class ValidacaoCadastroComponent implements OnInit {
  MENSAGENS = MENSAGENS;
  TEXTO_ACAO = TEXTO_ACAO;

  validacaoForm: FormGroup;
  clientLogin: string;
  codigoValido = false;
  exibirTermos = false;
  inativarBotaoReenviarCodigo = false;

  refDialogo: DynamicDialogRef | undefined;

  constructor(
    private activatedRoute: ActivatedRoute,
    private formBuilder: FormBuilder,
    private router: Router,
    private service: ClientService,
    private dialogService: DialogService,
    private readonly authService: AuthenticationService,
    private readonly authentication: Authentication
  ) {
    this.validacaoForm = this.formBuilder.group({
      codigo: ['', [Validators.required, Validators.pattern(CAMPOS_REGEX.CODIGO_SEIS_DIGITOS)]]
    });
  }

  ngOnInit(): void {
    this.activatedRoute.paramMap.subscribe(params => {
      this.clientLogin = params.get('login');
      if (!this.clientLogin) {
        console.error('Parâmetro "login" não encontrado na rota.');
      }
    });
  }

  enviarCodigo() {
    this.inativarBotaoReenviarCodigo = true;

    this.service.reenvioCodigo(this.clientLogin).subscribe(resposta => {
      if (resposta) {
        this.exibirDialogoSucessoReenvio();
        this.inativarBotaoReenviarCodigo = false;
      }
    });
  }

  validarCodigo() {
    this.service.validarCodigo(this.clientLogin, this.validacaoForm.value.codigo).subscribe({
      next: () => {
        this.codigoValido = true;
      }
    });
  }

  exibirDialogoSucessoReenvio() {
    const config = DialogoUtils.exibirSucesso(MENSAGENS.dialogo.reenvioCodigoValidacao, {
      acaoPrimariaCallback: () => {
        this.refDialogo?.close();
      }
    });

    this.refDialogo = this.dialogService.open(DialogoComponent, config);
  }

  cadastroSenhaFinalizado(senha: string) {
    this.fazerLogin(senha);
  }

  fazerLogin(senha: string) {
    this.authService.login(this.clientLogin, senha).subscribe(() => {
      this.authentication.pegarDadosAutenticado();
      this.exibirTermos = true;
    });
  }

  onInput(event: Event) {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(CAMPOS_REGEX.SOMENTE_NUMEROS_INPUT, '');
  }
}
