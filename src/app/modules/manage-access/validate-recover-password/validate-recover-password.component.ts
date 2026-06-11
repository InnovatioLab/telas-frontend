import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthenticationService } from '@app/core/service/api/authentication.service';
import { ClientService } from '@app/core/service/api/client.service';
import { CardCenteredComponent, ErrorComponent } from '@app/shared';
import { DialogComponent } from '@app/shared/components/dialog/dialog.component';
import { PrimengModule } from '@app/shared/primeng/primeng.module';
import { DialogUtils } from '@app/shared/utils/dialog-config.utils';
import { CAMPOS_REGEX, MESSAGES, ACTION_LABELS } from '@app/utility/src';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ResetPasswordComponent } from '../reset-password/reset-password.component';

@Component({
  selector: 'feat-validate-recover-password',
  standalone: true,
  imports: [
    CommonModule,
    PrimengModule,
    CardCenteredComponent,
    ErrorComponent,
    ResetPasswordComponent
  ],
  providers: [DialogService],
  templateUrl: './validate-recover-password.component.html',
  styleUrl: './validate-recover-password.component.scss'
})
export class ValidateRecoverPasswordComponent implements OnInit {
  MESSAGES = MESSAGES;
  ACTION_LABELS = ACTION_LABELS;

  validacaoForm: FormGroup;
  userLogin: string;
  codigoValido = false;
  inativarBotaoReenviarCodigo = false;

  dialogRef: DynamicDialogRef | undefined;

  constructor(
    private readonly activatedRoute: ActivatedRoute,
    private readonly formBuilder: FormBuilder,
    private readonly router: Router,
    private readonly service: ClientService,
    private readonly dialogService: DialogService,
    private readonly authService: AuthenticationService
  ) {
    this.validacaoForm = this.formBuilder.group({
      codigo: ['', [Validators.required, Validators.pattern(CAMPOS_REGEX.CODIGO_SEIS_DIGITOS)]]
    });
  }

  ngOnInit(): void {
    this.activatedRoute.paramMap.subscribe(params => {
      this.userLogin = params.get('login');
    });
  }

  goBack() {
    this.router.navigate(['authentication/login']);
  }

  enviarCodigo() {
    this.inativarBotaoReenviarCodigo = true;

    this.authService.recoverPassword(this.userLogin).subscribe(response => {
      if (response) {
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
    this.service.validarCodigo(this.userLogin, this.validacaoForm.value.codigo).subscribe(response => {
      if (response) {
        this.codigoValido = true;
      }
    });
  }

  exibirDialogoSucessoReenvio() {
    const config = DialogUtils.showSuccess(MESSAGES.dialog.resendValidationCode, {
      primaryActionCallback: () => {
        this.dialogRef?.close();
      }
    });

    this.dialogRef = this.dialogService.open(DialogComponent, config);
  }

  onInput(event: Event) {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(CAMPOS_REGEX.SOMENTE_NUMEROS_INPUT, '');
  }
}
