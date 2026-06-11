import { CommonModule } from "@angular/common";
import { Component, OnDestroy, OnInit } from "@angular/core";
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { PasswordDirective } from "@app/core/directives/password.directive";
import { AuthenticationService } from "@app/core/service/api/authentication.service";
import { PasswordRequestDto } from "@app/model/dto/request/password-request.dto";
import { CardCenteredComponent, ErrorComponent } from "@app/shared";
import { DialogComponent } from "@app/shared/components/dialog/dialog.component";
import { PrimengModule } from "@app/shared/primeng/primeng.module";
import { DialogUtils } from "@app/shared/utils/dialog-config.utils";
import { MESSAGES, MessagesConstants, ACTION_LABELS } from "@app/utility/src";
import { AplicarMascaramentoUtils } from "@app/utility/src/lib/utils/aplicar-mascaramento.utils";
import { DialogService, DynamicDialogRef } from "primeng/dynamicdialog";

@Component({
  selector: "feat-reset-password",
  standalone: true,
  imports: [
    CommonModule,
    PrimengModule,
    CardCenteredComponent,
    ErrorComponent,
    ReactiveFormsModule,
    PasswordDirective,
  ],
  providers: [DialogService],
  templateUrl: "./reset-password.component.html",
  styleUrl: "./reset-password.component.scss",
})
export class ResetPasswordComponent implements OnInit, OnDestroy {
  MESSAGES: MessagesConstants = MESSAGES;
  ACTION_LABELS = ACTION_LABELS;

  userLogin: string;
  redefinirForm: FormGroup;
  usuarioID: string;
  preferenciaContato = "WHATSAPP";

  dialogRef: DynamicDialogRef | undefined;

  constructor(
    private readonly activatedRoute: ActivatedRoute,
    private readonly fb: FormBuilder,
    private readonly router: Router,
    private readonly authService: AuthenticationService,
    public dialogService: DialogService
  ) {
    this.redefinirForm = this.fb.group({
      password: [null, Validators.required],
      confirmPassword: [null, Validators.required],
    });
  }

  ngOnInit(): void {
    this.activatedRoute.paramMap.subscribe((params) => {
      this.userLogin = params.get("login");

      this.aplicarMascaraNoDocumento();
    });
  }

  ngOnDestroy() {
    if (this.dialogRef) {
      this.dialogRef.close();
      this.dialogRef = undefined;
    }
  }

  navegarLogin() {
    this.router.navigate(["auth/login"]);
  }

  cancel() {
    const message = MESSAGES.dialog.cancelPasswordReset;
    const config = DialogUtils.showAlert(message, {
      primaryAction: "No, go back",
      primaryActionCallback: () => {
        this.dialogRef?.close();
      },

      secondaryAction: "Yes, cancel",
      secondaryActionCallback: () => {
        this.dialogRef?.close();
        this.navegarLogin();
      },
    });

    this.dialogRef = this.dialogService.open(DialogComponent, config);
  }

  save() {
    if (this.redefinirForm.invalid) {
      this.redefinirForm.markAllAsTouched();
      return;
    }

    const passwordData = new PasswordRequestDto(
      this.redefinirForm.value.password,
      this.redefinirForm.value.confirmPassword
    );

    this.authService.resetPassword(this.userLogin, passwordData).subscribe(() => {
      this.exibirMensagemSucesso();
    });
  }

  exibirErroSenhaDiferente() {
    if (
      this.redefinirForm.get("confirmPassword")?.dirty &&
      this.redefinirForm.get("password")?.value !==
        this.redefinirForm.get("confirmPassword")?.value
    ) {
      return true;
    }

    return false;
  }

  impedirColar(event: Event): void {
    event.preventDefault();
  }

  aplicarMascaraNoDocumento(): void {
    if (this.userLogin) {
      const valorCampoLogin = AplicarMascaramentoUtils.aplicarMascaraDocumento(
        this.userLogin
      );
      this.redefinirForm.get("login")?.setValue(valorCampoLogin);
    }
  }

  exibirMensagemSucesso() {
    const config = DialogUtils.showSuccess(
      MESSAGES.dialog.passwordReset,
      {
        primaryActionCallback: () => {
          this.dialogRef.close();
          this.navegarLogin();
        },
      }
    );

    this.dialogRef = this.dialogService.open(DialogComponent, {
      ...config,
      closeOnEscape: false,
      closable: false,
    });
  }
}
