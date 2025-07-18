import { CommonModule } from '@angular/common';
import { Component, inject, Input, OnInit } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ClientService } from '@app/core/service/api/client.service';
import { PrimengModule } from '@app/shared/primeng/primeng.module';
import { AbstractControlUtils } from '@app/shared/utils/abstract-control.utils';
import { DialogoUtils } from '@app/shared/utils/dialogo-config.utils';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { DialogoComponent } from '../../dialogo/dialogo.component';
import { ErrorComponent } from '../../error/error.component';

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
      this.contatoForm.addControl('numeroContato', new FormControl('', [
        Validators.required,
        Validators.pattern(/^\+[0-9]{1,3}\s[0-9]{3}\s[0-9]{3}\s[0-9]{4}$/)
      ]));
    } else {
      this.contatoForm.get('numeroContato').setValidators([
        Validators.required,
        Validators.pattern(/^\+[0-9]{1,3}\s[0-9]{3}\s[0-9]{3}\s[0-9]{4}$/)
      ]);
      this.contatoForm.get('numeroContato').updateValueAndValidity();
    }
    if (!this.contatoForm.get('email')) {
      this.contatoForm.addControl('email', new FormControl('', [
        Validators.required, 
        Validators.email,
        Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
      ]));
    } else {
      this.contatoForm.get('email').setValidators([
        Validators.required, 
        Validators.email,
        Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
      ]);
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
    return numeroLimpo.length >= 10 && numeroLimpo.length <= 15 && /^[0-9]+$/.test(numeroLimpo);
  }

  private normalizarContato(numero: string): string {
    return numero.replace(/[^0-9+]/g, '');
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
