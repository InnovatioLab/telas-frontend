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
import { DialogUtils } from "@app/shared/utils/dialog-config.utils";
import { MESSAGES, ACTION_LABELS } from "@app/utility/src";
import { MessagesUtils } from "@app/utility/src/lib/utils/messages-utils.utils";
import { DialogService, DynamicDialogRef } from "primeng/dynamicdialog";
import { ENVIRONMENT } from "src/environments/environment-token";
import { CardCenteredComponent } from "../../../shared/components/card-centered/card-centered.component";
import { DialogComponent } from "../../../shared/components/dialog/dialog.component";
import { ErrorComponent } from "../../../shared/components/error/error.component";

@Component({
  selector: "feat-resume-registration",
  standalone: true,
  imports: [
    CommonModule,
    PrimengModule,
    CardCenteredComponent,
    ErrorComponent,
    ReactiveFormsModule,
  ],
  providers: [DialogService],
  templateUrl: "./resume-registration.component.html",
  styleUrl: "./resume-registration.component.scss",
})
export class ResumeRegistrationComponent implements OnDestroy {
  private readonly env = inject(ENVIRONMENT);

  MESSAGES = MESSAGES;
  ACTION_LABELS = ACTION_LABELS;
  invalidarBotao = false;

  form: FormGroup;
  dialogRef: DynamicDialogRef | undefined;

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
    if (this.dialogRef) {
      this.dialogRef.close();
      this.dialogRef = undefined;
    }
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const userLogin = this.form.get("email")?.value;

    this.findUser(userLogin);
  }

  findUser(email: string) {
    this.invalidarBotao = true;

    this.clientService.clientExistente(email).subscribe({
      next: (response) => {
        const status = response.status;
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
    const message = MessagesUtils.replaceVariableInText(
      MESSAGES.dialog.emailAlreadyRegistered,
      [this.env.emailSuporte]
    );

    const config = DialogUtils.showAlert(message, {
      primaryActionCallback: () => {
        this.dialogRef.close();
      },
    });

    this.dialogRef = this.dialogService.open(DialogComponent, config);
  }

  showAlert(message: string) {
    const config = DialogUtils.showAlert(message, {
      primaryActionCallback: () => {
        this.dialogRef.close();
      },
    });

    this.dialogRef = this.dialogService.open(DialogComponent, config);
  }

  goBack() {
    this.location.back();
  }

  exibirErroLoginNaoEncontrado() {
    this.showAlert(MESSAGES.dialog.clientNotFound);
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
