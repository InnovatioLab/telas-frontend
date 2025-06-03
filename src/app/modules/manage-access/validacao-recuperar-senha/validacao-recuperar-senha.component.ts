import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  CardCentralizadoComponent,
  DialogoComponent,
  ErrorComponent,
  PrimengModule
} from '@raizes-cearenses-nx/shared-ui';
import { DialogoUtils, MENSAGENS, TEXTO_ACAO } from '@raizes-cearenses-nx/utility';
import { UserService } from '@raizes-cearenses-nx/user';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { AuthenticationService } from '@raizes-cearenses-nx/authentication-data-access';
import { RedefinirSenhaComponent } from '../redefinir-senha/redefinir-senha.component';
import { CAMPOS_REGEX } from '@raizes-cearenses-nx/produto';

@Component({
  selector: 'feat-validacao-recuperar-senha',
  standalone: true,
  imports: [
    CommonModule,
    PrimengModule,
    CardCentralizadoComponent,
    ErrorComponent,
    RedefinirSenhaComponent
  ],
  providers: [DialogService],
  templateUrl: './validacao-recuperar-senha.component.html',
  styleUrl: './validacao-recuperar-senha.component.scss'
})
export class ValidacaoRecuperaSenhaComponent implements OnInit {
  MENSAGENS = MENSAGENS;
  TEXTO_ACAO = TEXTO_ACAO;

  validacaoForm: FormGroup;
  usuarioLogin: string;
  codigoValido = false;
  inativarBotaoReenviarCodigo = false;

  refDialogo: DynamicDialogRef | undefined;

  constructor(
    private activatedRoute: ActivatedRoute,
    private formBuilder: FormBuilder,
    private router: Router,
    private service: UserService,
    private dialogService: DialogService,
    private authService: AuthenticationService
  ) {
    this.validacaoForm = this.formBuilder.group({
      codigo: ['', [Validators.required, Validators.pattern(CAMPOS_REGEX.CODIGO_SEIS_DIGITOS)]]
    });
  }

  ngOnInit(): void {
    this.activatedRoute.paramMap.subscribe(params => {
      this.usuarioLogin = params.get('login');
    });
  }

  voltar() {
    this.router.navigate(['authentication/login']);
  }

  enviarCodigo() {
    this.inativarBotaoReenviarCodigo = true;

    this.authService.recuperarSenha(this.usuarioLogin).subscribe(resposta => {
      if (resposta) {
        this.exibirDialogoSucessoReenvio();
        this.inativarBotaoReenviarCodigo = false;
      }
    });
  }

  validarCodigo() {
    if (this.validacaoForm.invalid) {
      this.validacaoForm.markAllAsTouched();
      return;
    }
    this.service.validarCodigo(this.usuarioLogin, this.validacaoForm.value.codigo).subscribe(response => {
      if (response) {
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

  onInput(event: Event) {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(CAMPOS_REGEX.SOMENTE_NUMEROS_INPUT, '');
  }
}
