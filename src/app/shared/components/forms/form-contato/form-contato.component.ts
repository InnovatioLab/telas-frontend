import { Component, inject, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { PrimengModule } from '@app/shared/primeng/primeng.module';
import { ErrorComponent } from '../../error/error.component';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ClientService } from '@app/core/service/client.service';
import { DialogoUtils } from '@app/shared/utils/dialogo-config.utils';
import { AbstractControlUtils } from '@app/shared/utils/abstract-control.utils';
import { DialogoComponent } from '../../dialogo/dialogo.component';

@Component({
  selector: 'ui-form-contato',
  standalone: true,
  imports: [CommonModule, PrimengModule, ReactiveFormsModule, ErrorComponent],
  templateUrl: './form-contato.component.html',
  styleUrl: './form-contato.component.scss'
})
export class FormContatoComponent implements OnInit {
  @Input() contatoForm: FormGroup;
  ref: DynamicDialogRef | undefined;
  private readonly clientService = inject(ClientService);

  constructor(public dialogService: DialogService) {}

  ngOnInit(): void {
    if (!this.contatoForm) {
      console.error('contatoForm não foi inicializado.');
      return;
    }

    if (!this.contatoForm.get('numeroContato')) {
      this.contatoForm.addControl('numeroContato', new FormControl('', Validators.required));
    } else {
      this.contatoForm.get('numeroContato').setValidators(Validators.required);
      this.contatoForm.get('numeroContato').updateValueAndValidity();
    }
    if (!this.contatoForm.get('email')) {
      this.contatoForm.addControl('email', new FormControl('', [Validators.required, Validators.email]));
    } else {
      this.contatoForm.get('email').setValidators([Validators.required, Validators.email]);
      this.contatoForm.get('email').updateValueAndValidity();
    }
    
    if (this.contatoForm.get('state')) {
      this.contatoForm.removeControl('state');
    }
  }

  campoObrigatorio(campo: string): boolean {
    const control = this.contatoForm.get(campo);

    const validatorFn = control?.validator?.({} as AbstractControl);
    if (validatorFn && 'required' in validatorFn) {
      return true;
    }

    return false;
  }

  mostrarErro(form: FormGroup, campo: string): boolean {
    return form.get(campo)?.invalid && form.get(campo)?.touched;
  }

  private numeroValido(numero: string): boolean {
    const numeroLimpo = this.normalizarContato(numero);
    return numeroLimpo.length === 11;
  }

  private normalizarContato(numero: string): string {
    const numeroLimpo = numero.replace(/\D/g, '');
    return numeroLimpo;
  }

  mensagemAlertaLimparCampo(mensagem: string, campo: string) {
    const config = DialogoUtils.exibirAlerta(mensagem, {
      acaoPrimariaCallback: () => {
        this.ref.close();
        AbstractControlUtils.limparCampo(this.contatoForm, campo);
      }
    });
    this.ref = this.dialogService.open(DialogoComponent, config);
  }
}
