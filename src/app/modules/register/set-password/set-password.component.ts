import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { PasswordDirective } from '@app/core/directives/password.directive';
import { ClientService } from '@app/core/service/api/client.service';
import { PasswordRequestDto } from '@app/model/dto/request/password-request.dto';
import { CardCenteredComponent, ErrorComponent } from '@app/shared';
import { DialogComponent } from '@app/shared/components/dialog/dialog.component';
import { IconsModule } from '@app/shared/icons/icons.module';
import { PrimengModule } from '@app/shared/primeng/primeng.module';
import { DialogUtils } from '@app/shared/utils/dialog-config.utils';
import { MESSAGES, MessagesConstants, ACTION_LABELS } from '@app/utility/src';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';

@Component({
  selector: 'feat-set-password',
  standalone: true,
  imports: [
    CommonModule,
    PrimengModule,
    CardCenteredComponent,
    ErrorComponent,
    ReactiveFormsModule,
    PasswordDirective,
    IconsModule
  ],
  providers: [DialogService],
  templateUrl: './set-password.component.html',
  styleUrl: './set-password.component.scss'
})
export class SetPasswordComponent implements OnInit, OnDestroy {
  @Output() registrationCompleted = new EventEmitter<string>();

  MESSAGES: MessagesConstants = MESSAGES;
  ACTION_LABELS = ACTION_LABELS;

  userLogin: string;
  passwordForm: FormGroup;
  usuarioID: string;
  preferenciaContato = 'PHONE';

  dialogRef: DynamicDialogRef | undefined;

  constructor(
    private readonly activatedRoute: ActivatedRoute,
    private readonly fb: FormBuilder,
    private readonly service: ClientService,
    public dialogService: DialogService
  ) {
    this.passwordForm = this.fb.group({
      login: [{ value: null, disabled: true }],
      password: [null, Validators.required],
      confirmPassword: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    this.activatedRoute.paramMap.subscribe(params => {
      this.userLogin = params.get('login');
    });
  }

  ngOnDestroy() {
    if (this.dialogRef) {
      this.dialogRef.close();
      this.dialogRef = undefined;
    }
  }

  save() {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      this.passwordForm.markAsDirty();
      return;
    }
    const passwordData = new PasswordRequestDto(
      this.passwordForm.value.password,
      this.passwordForm.value.confirmPassword
    );

    this.service.createPassword(this.userLogin, passwordData).subscribe(() => {
      this.exibirMensagemBoasVindas();
    });
  }

  exibirErroSenhaDiferente() {
    if (
      this.passwordForm.get('confirmPassword')?.dirty &&
      this.passwordForm.get('password')?.value !== this.passwordForm.get('confirmPassword')?.value
    ) {
      return true;
    }

    return false;
  }

  impedirColar(event: Event): void {
    event.preventDefault();
  }

  exibirDialogoAlerta(texto: string) {
    const config = DialogUtils.showAlert(texto, {
      primaryActionCallback: () => {
        this.dialogRef?.close();
      }
    });

    this.dialogRef = this.dialogService.open(DialogComponent, config);
  }

  exibirMensagemBoasVindas() {
    const config = DialogUtils.showSuccess(MESSAGES.dialog.registrationSuccess, {
      primaryActionCallback: () => {
        this.registrationCompleted.emit(this.passwordForm.value.password);
        this.dialogRef.close();
      }
    });

    this.dialogRef = this.dialogService.open(DialogComponent, {
      ...config,
      closeOnEscape: false,
      closable: false
    });
  }
}
