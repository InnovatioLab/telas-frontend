import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { AutenticacaoService } from "@app/core/service/api/autenticacao.service";
import { ClientService } from "@app/core/service/api/client.service";
import { CardCentralizadoComponent, ErrorComponent } from "@app/shared";
import { DialogoComponent } from "@app/shared/components/dialogo/dialogo.component";
import { PrimengModule } from "@app/shared/primeng/primeng.module";
import { DialogoUtils } from "@app/shared/utils/dialogo-config.utils";
import { CAMPOS_REGEX, MENSAGENS, TEXTO_ACAO } from "@app/utility/src";
import { DialogService, DynamicDialogRef } from "primeng/dynamicdialog";
import { CadastrarSenhaComponent } from "../cadastrar-senha/cadastrar-senha.component";

@Component({
  selector: "feat-validacao-cadastro",
  standalone: true,
  imports: [
    CommonModule,
    PrimengModule,
    CardCentralizadoComponent,
    ErrorComponent,
    CadastrarSenhaComponent,
  ],
  providers: [DialogService],
  templateUrl: "./validacao-cadastro.component.html",
  styleUrl: "./validacao-cadastro.component.scss",
})
export class ValidacaoCadastroComponent implements OnInit {
  MENSAGENS = MENSAGENS;
  TEXTO_ACAO = TEXTO_ACAO;

  validacaoForm: FormGroup;
  clientLogin: string;
  codigoValido = false;
  inativarBotaoReenviarCodigo = false;

  refDialogo: DynamicDialogRef | undefined;

  constructor(
    private readonly activatedRoute: ActivatedRoute,
    private readonly formBuilder: FormBuilder,
    private readonly service: ClientService,
    private readonly dialogService: DialogService,
    private readonly authService: AutenticacaoService,
    private readonly router: Router
  ) {
    this.validacaoForm = this.formBuilder.group({
      codigo: [
        "",
        [
          Validators.required,
          Validators.pattern(CAMPOS_REGEX.CODIGO_SEIS_DIGITOS),
        ],
      ],
    });
  }

  ngOnInit(): void {
    this.activatedRoute.paramMap.subscribe((params) => {
      this.clientLogin = params.get("login");
      if (!this.clientLogin) {
        console.error('Parâmetro "login" não encontrado na rota.');
      }
    });
  }

  enviarCodigo() {
    this.inativarBotaoReenviarCodigo = true;

    this.service.reenvioCodigo(this.clientLogin).subscribe((resposta) => {
      if (resposta) {
        this.exibirDialogoSucessoReenvio();
        this.inativarBotaoReenviarCodigo = false;
      }
    });
  }

  validarCodigo() {
    this.service
      .validarCodigo(this.clientLogin, this.validacaoForm.value.codigo)
      .subscribe({
        next: () => {
          this.codigoValido = true;
        },
      });
  }

  exibirDialogoSucessoReenvio() {
    const config = DialogoUtils.exibirSucesso(
      MENSAGENS.dialogo.reenvioCodigoValidacao,
      {
        acaoPrimariaCallback: () => {
          this.refDialogo?.close();
        },
      }
    );

    this.refDialogo = this.dialogService.open(DialogoComponent, config);
  }

  cadastroSenhaFinalizado(senha: string) {
    this.fazerLogin(senha);
  }

  fazerLogin(senha: string) {
    this.authService
      .login({
        username: this.clientLogin,
        password: senha,
      })
      .subscribe({
        next: (response: any) => {
          if (response) {
            this.router.navigate(["/terms-of-service"]);
          }
        },
      });
  }

  onInput(event: Event) {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(CAMPOS_REGEX.SOMENTE_NUMEROS_INPUT, "");
  }
}
