import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { Router } from "@angular/router";
import { AuthenticationService } from "@app/core/service/api/authentication.service";
import { ClientService } from "@app/core/service/api/client.service";
import { CardCenteredComponent, ErrorComponent } from "@app/shared";
import { DialogComponent } from "@app/shared/components/dialog/dialog.component";
import { PrimengModule } from "@app/shared/primeng/primeng.module";
import { AbstractControlUtils } from "@app/shared/utils/abstract-control.utils";
import { DialogUtils } from "@app/shared/utils/dialog-config.utils";
import { MESSAGES, ACTION_LABELS } from "@app/utility/src";
import { DialogService, DynamicDialogRef } from "primeng/dynamicdialog";

@Component({
  selector: "feat-recover-password",
  standalone: true,
  imports: [
    CommonModule,
    PrimengModule,
    CardCenteredComponent,
    ErrorComponent,
    ReactiveFormsModule,
  ],
  providers: [DialogService, DialogUtils],
  templateUrl: "./recover-password.component.html",
  styleUrl: "./recover-password.component.scss",
})
export class RecoverPasswordComponent {
  dialogRef: DynamicDialogRef | undefined;
  MESSAGES = MESSAGES;
  ACTION_LABELS = ACTION_LABELS;

  form: FormGroup;

  constructor(
    private readonly fb: FormBuilder,
    private readonly router: Router,
    private readonly clientService: ClientService,
    private readonly authService: AuthenticationService,
    public dialogService: DialogService
  ) {
    this.form = this.fb.group({
      login: [
        null,
        [Validators.required, Validators.email, Validators.maxLength(255)],
      ],
    });
  }

  showError(campo: string): boolean {
    return AbstractControlUtils.isFieldInvalidAndTouched(this.form, campo);
  }

  goBack() {
    this.router.navigate(["/login"]);
  }

  next() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.buscarClient(this.form.get("login")?.value);
  }

  buscarClient(login: string) {
    this.clientService
      .buscaClientPorIdentificador(login)
      .subscribe((response) => {
        if (response) {
          this.redirecionarValidacaoCadastro(login);
        } else {
          this.showAlert(MESSAGES.dialog.identifierNotFound);
        }
      });
  }

  showAlert(message: string) {
    const config = DialogUtils.showAlert(message, {
      primaryActionCallback: () => {
        this.dialogRef.close();
      },
    });

    this.dialogRef = this.dialogService.open(DialogComponent, config);
  }

  recoverPassword() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const login = this.form.get("login")?.value;
    this.authService.recoverPassword(login).subscribe({
      next: () => this.redirecionarValidacaoRecuperar(login),
      error: () =>
        this.showAlert(MESSAGES.dialog.identifierNotFound),
    });
  }

  redirecionarValidacaoRecuperar(login: string) {
    this.router.navigate(["/register/validate-code-recover-password", login]);
  }

  reenviarCodigo() {
    const login = this.form.get("login")?.value;
    this.clientService.reenvioCodigo(login).subscribe({
      next: () => this.redirecionarValidacaoCadastro(login),
    });
  }

  redirecionarValidacaoCadastro(login: string) {
    this.clientService.reenvioCodigo(login).subscribe();
    this.router.navigate(["/register/validate-code-recover-password", login]);
  }
}
