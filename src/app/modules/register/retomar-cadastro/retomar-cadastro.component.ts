import { CommonModule, Location } from "@angular/common";
import { Component, inject, OnDestroy } from "@angular/core";
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { Router } from "@angular/router";
import { ClientService } from "@app/core/service/api/client.service";
import { PrimengModule } from "@app/shared/primeng/primeng.module";
import { DialogoUtils } from "@app/shared/utils/dialogo-config.utils";
import { MENSAGENS, TEXTO_ACAO } from "@app/utility/src";
import { MensagensUtils } from "@app/utility/src/lib/utils/mensagens-utils.utils";
import { DialogService, DynamicDialogRef } from "primeng/dynamicdialog";
import { ENVIRONMENT } from "src/environments/environment-token";
import { CardCentralizadoComponent } from "../../../shared/components/card-centralizado/card-centralizado.component";
import { DialogoComponent } from "../../../shared/components/dialogo/dialogo.component";
import { ErrorComponent } from "../../../shared/components/error/error.component";

@Component({
  selector: "feat-retomar-cadastro",
  standalone: true,
  imports: [
    CommonModule,
    PrimengModule,
    CardCentralizadoComponent,
    ErrorComponent,
    ReactiveFormsModule,
  ],
  providers: [DialogService],
  templateUrl: "./retomar-cadastro.component.html",
  styleUrl: "./retomar-cadastro.component.scss",
})
export class RetomarCadastroComponent implements OnDestroy {
  private readonly env = inject(ENVIRONMENT);

  MENSAGENS = MENSAGENS;
  TEXTO_ACAO = TEXTO_ACAO;
  invalidarBotao = false;

  form: FormGroup;
  refDialogo: DynamicDialogRef | undefined;

  constructor(
    private readonly fb: FormBuilder,
    private readonly location: Location,
    private readonly router: Router,
    private readonly clientService: ClientService,
    public dialogService: DialogService
  ) {
    this.form = this.fb.group({
      email: [
        null,
        [Validators.required, Validators.email, Validators.maxLength(255)],
      ],
    });
  }

  ngOnDestroy() {
    if (this.refDialogo) {
      this.refDialogo.close();
      this.refDialogo = undefined;
    }
  }

  salvar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const usuarioLogin = this.form.get("email")?.value;

    this.buscarUsuario(usuarioLogin);
  }

  buscarUsuario(email: string) {
    this.invalidarBotao = true;

    this.clientService.clientExistente(email).subscribe({
      next: (resposta) => {
        const status = resposta.status;
        if (status === "ACTIVE") {
          this.exibirAlertaEtapaSenhaConcluida();
        } else {
          this.reenviarCodigo();
        }
        this.invalidarBotao = false;
      },
      error: () => {
        this.exibirErroLoginNaoEncontrado();
        this.invalidarBotao = false;
      },
    });
  }

  exibirAlertaEtapaSenhaConcluida() {
    const mensagem = MensagensUtils.substituirVariavelNoTexto(
      MENSAGENS.dialogo.jaPossuiContaRetomarCadastro,
      [this.env.emailSuporte]
    );

    const config = DialogoUtils.exibirAlerta(mensagem, {
      acaoPrimariaCallback: () => {
        this.refDialogo.close();
      },
    });

    this.refDialogo = this.dialogService.open(DialogoComponent, config);
  }

  exibirAlerta(mensagem: string) {
    const config = DialogoUtils.exibirAlerta(mensagem, {
      acaoPrimariaCallback: () => {
        this.refDialogo.close();
      },
    });

    this.refDialogo = this.dialogService.open(DialogoComponent, config);
  }

  voltar() {
    this.location.back();
  }

  exibirErroLoginNaoEncontrado() {
    this.exibirAlerta(MENSAGENS.dialogo.clientNaoEncontrado);
  }

  redirecionarValidacaoCadastro() {
    this.router.navigate(["/register/validate", this.form.get("email")?.value]);
  }

  reenviarCodigo() {
    this.clientService
      .reenvioCodigo(this.form.get("email")?.value)
      .subscribe((res: any) => {
        if (res) {
          this.redirecionarValidacaoCadastro();
        }
      });
  }
}
