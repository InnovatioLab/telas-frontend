import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { ClientService } from "@app/core/service/api/client.service";
import { CardCenteredComponent, ErrorComponent } from "@app/shared";
import { DialogComponent } from "@app/shared/components/dialog/dialog.component";
import { PrimengModule } from "@app/shared/primeng/primeng.module";
import { DialogUtils } from "@app/shared/utils/dialog-config.utils";
import { CAMPOS_REGEX, MESSAGES, ACTION_LABELS } from "@app/utility/src";
import { DialogService, DynamicDialogRef } from "primeng/dynamicdialog";
import { SetPasswordComponent } from "../set-password/set-password.component";

@Component({
  selector: "feat-validate-registration",
  standalone: true,
  imports: [
    CommonModule,
    PrimengModule,
    CardCenteredComponent,
    ErrorComponent,
    SetPasswordComponent,
  ],
  providers: [DialogService],
  templateUrl: "./validate-registration.component.html",
  styleUrl: "./validate-registration.component.scss",
})
export class ValidateRegistrationComponent implements OnInit {
  MESSAGES = MESSAGES;
  ACTION_LABELS = ACTION_LABELS;

  validacaoForm: FormGroup;
  clientLogin: string;
  codigoValido = false;
  inativarBotaoReenviarCodigo = false;

  dialogRef: DynamicDialogRef | undefined;

  constructor(
    private readonly activatedRoute: ActivatedRoute,
    private readonly formBuilder: FormBuilder,
    private readonly service: ClientService,
    private readonly dialogService: DialogService,
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
    });
  }

  enviarCodigo() {
    this.inativarBotaoReenviarCodigo = true;

    this.service.reenvioCodigo(this.clientLogin).subscribe((response) => {
      if (response) {
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
    const config = DialogUtils.showSuccess(
      MESSAGES.dialog.resendValidationCode,
      {
        primaryActionCallback: () => {
          this.dialogRef?.close();
        },
      }
    );

    this.dialogRef = this.dialogService.open(DialogComponent, config);
  }

  cadastroSenhaFinalizado(_senha: string) {
    void _senha;
    void this.router.navigate(["/"], { replaceUrl: true });
  }

  onInput(event: Event) {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(CAMPOS_REGEX.SOMENTE_NUMEROS_INPUT, "");
  }

}
