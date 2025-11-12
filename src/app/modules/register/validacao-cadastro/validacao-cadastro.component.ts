import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { AutenticacaoService } from "@app/core/service/api/autenticacao.service";
import { ClientService } from "@app/core/service/api/client.service";
import { Authentication } from "@app/core/service/auth/autenthication";
import { Role } from "@app/model/client";
import { CardCentralizadoComponent, ErrorComponent } from "@app/shared";
import { DialogoComponent } from "@app/shared/components/dialogo/dialogo.component";
import { PrimengModule } from "@app/shared/primeng/primeng.module";
import { DialogoUtils } from "@app/shared/utils/dialogo-config.utils";
import { CAMPOS_REGEX, MENSAGENS, TEXTO_ACAO } from "@app/utility/src";
import { DialogService, DynamicDialogRef } from "primeng/dynamicdialog";
import { firstValueFrom, of } from "rxjs";
import { switchMap, take } from "rxjs/operators";
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
    private readonly clientService: ClientService,
    private readonly router: Router,
    private readonly authentication: Authentication
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
          if (response && response.client) {
            // login já sincronizou o estado global; apenas navega
            this.handleNavigation();
          }
        },
      });
  }

  onInput(event: Event) {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(CAMPOS_REGEX.SOMENTE_NUMEROS_INPUT, "");
  }

  async handleNavigation() {
    // Usa o estado já carregado em `Authentication` (via pegarDadosAutenticado)
    // para decidir a navegação. Isso evita chamadas concorrentes e garante
    // que `HeaderActionsService` e outros consumidores vejam o usuário correto.
    const client = this.authentication._clientSignal();
    if (!client) {
      // Fallback: tentar obter do serviço caso o signal não esteja populado
      try {
        const authenticatedClient = await firstValueFrom(
          this.clientService.clientAtual$.pipe(
            take(1),
            switchMap((c) =>
              c ? of(c) : this.clientService.getAuthenticatedClient()
            )
          )
        );
        if ((authenticatedClient as any)?.role === Role.ADMIN) {
          this.router.navigate(["/admin"]);
        } else {
          this.router.navigate(["/terms-of-service"]);
        }
        return;
      } catch (error) {
        this.router.navigate(["/"]);
        return;
      }
    }

    if (client.role !== Role.ADMIN) {
      this.router.navigate(["/terms-of-service"]);
    } else {
      this.router.navigate(["/admin"]);
    }
  }
}
