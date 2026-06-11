import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { PasswordDirective } from "@app/core/directives/password.directive";
import { AuthenticationService } from "@app/core/service/api/authentication.service";
import { PasswordUpdateRequest } from "@app/model/dto/request/password-update.request";
import { PrimengModule } from "@app/shared/primeng/primeng.module";
import { MessageService } from "primeng/api";
import { ButtonModule } from "primeng/button";
import { ToastModule } from "primeng/toast";
import { finalize } from "rxjs";
import { ErrorComponent } from "../error/error.component";

@Component({
  selector: "app-change-password",
  templateUrl: "./change-password.component.html",
  styleUrls: ["./change-password.component.scss"],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    ToastModule,
    ErrorComponent,
    PasswordDirective,
    PrimengModule,
  ],
  providers: [MessageService],
})
export class ChangePasswordComponent {
  formSenha: FormGroup;
  loading = false;
  senhaVisivel = false;
  confirmacaoVisivel = false;
  senhaAtualVisivel = false;

  constructor(
    private fb: FormBuilder,
    private autenticacaoService: AuthenticationService,
    private messageService: MessageService
  ) {
    this.formSenha = this.fb.group(
      {
        senhaAtual: [
          "",
          [
            Validators.required,
            Validators.minLength(8),
            Validators.maxLength(32),
          ],
        ],
        novaSenha: [
          "",
          [
            Validators.required,
            Validators.minLength(8),
            Validators.maxLength(32),
          ],
        ],
        confirmacaoSenha: [
          "",
          [
            Validators.required,
            Validators.minLength(8),
            Validators.maxLength(32),
          ],
        ],
      },
      {
        validators: this.senhasIguais("novaSenha", "confirmacaoSenha"),
      }
    );
  }

  senhasIguais(controlName: string, matchingControlName: string) {
    return (formGroup: FormGroup) => {
      const control = formGroup.controls[controlName];
      const matchingControl = formGroup.controls[matchingControlName];

      if (
        matchingControl.errors &&
        !matchingControl.errors["senhasDiferentes"]
      ) {
        return;
      }

      if (control.value !== matchingControl.value) {
        matchingControl.setErrors({ senhasDiferentes: true });
      } else {
        matchingControl.setErrors(null);
      }
    };
  }

  changePassword(): void {
    if (this.formSenha.invalid) {
      this.formSenha.markAllAsTouched();
      return;
    }

    this.loading = true;

    const passwordUpdateRequest: PasswordUpdateRequest = {
      currentPassword: this.formSenha.get("senhaAtual").value,
      password: this.formSenha.get("novaSenha").value,
      confirmPassword: this.formSenha.get("confirmacaoSenha").value,
    };

    this.autenticacaoService
      .changePassword(passwordUpdateRequest)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (response) => {
          this.messageService.add({
            severity: "success",
            summary: "Success",
            detail: "Password changed successfully!",
          });
          this.formSenha.reset();
        },
        error: (error) => {
          let mensagemErro = "Error changing password. Please try again.";

          if (error.status === 401) {
            mensagemErro = "Incorrect current password. Please verify.";
          } else if (error.error?.message) {
            mensagemErro = error.error.message;
          }

          this.messageService.add({
            severity: "error",
            summary: "Error",
            detail: mensagemErro,
          });
        },
      });
  }

  toggleSenha(campo: string): void {
    if (campo === "senhaAtual") {
      this.senhaAtualVisivel = !this.senhaAtualVisivel;
    } else if (campo === "novaSenha") {
      this.senhaVisivel = !this.senhaVisivel;
    } else if (campo === "confirmacaoSenha") {
      this.confirmacaoVisivel = !this.confirmacaoVisivel;
    }
  }
}
