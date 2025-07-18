import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IconOlhoComponent } from '@app/shared/icons/olho.icon';
import { IconOlhoFechadoComponent } from '@app/shared/icons/olho-fechado.icon';
import { ButtonModule } from 'primeng/button';
import { AutenticacaoService } from '@app/core/service/api/autenticacao.service';
import { SenhaUpdate } from '@app/model/dto/request/senha-update.request';
import { finalize } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-alterar-senha',
  templateUrl: './alterar-senha.component.html',
  styleUrls: ['./alterar-senha.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    IconOlhoComponent,
    IconOlhoFechadoComponent,
    ToastModule
  ],
  providers: [MessageService]
})
export class AlterarSenhaComponent implements OnInit {
  formSenha: FormGroup;
  loading = false;
  senhaVisivel = false;
  confirmacaoVisivel = false;
  senhaAtualVisivel = false;

  constructor(
    private fb: FormBuilder,
    private autenticacaoService: AutenticacaoService,
    private messageService: MessageService
  ) {
    this.formSenha = this.fb.group({
      senhaAtual: ['', [Validators.required]],
      novaSenha: ['', [Validators.required, Validators.minLength(8)]],
      confirmacaoSenha: ['', [Validators.required]]
    }, {
      validators: this.senhasIguais('novaSenha', 'confirmacaoSenha')
    });
  }

  ngOnInit(): void {}

  senhasIguais(controlName: string, matchingControlName: string) {
    return (formGroup: FormGroup) => {
      const control = formGroup.controls[controlName];
      const matchingControl = formGroup.controls[matchingControlName];

      if (matchingControl.errors && !matchingControl.errors['senhasDiferentes']) {
        return;
      }

      if (control.value !== matchingControl.value) {
        matchingControl.setErrors({ senhasDiferentes: true });
      } else {
        matchingControl.setErrors(null);
      }
    };
  }

  alterarSenha(): void {
    if (this.formSenha.invalid) {
      this.formSenha.markAllAsTouched();
      return;
    }

    this.loading = true;
    
    const senhaUpdateRequest: SenhaUpdate = {
      currentPassword: this.formSenha.get('senhaAtual').value,
      password: this.formSenha.get('novaSenha').value,
      confirmPassword: this.formSenha.get('confirmacaoSenha').value
    };

    this.autenticacaoService.alterarSenha(senhaUpdateRequest)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (response) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Password changed successfully!'
          });
          this.formSenha.reset();
        },
        error: (error) => {
          let mensagemErro = 'Error changing password. Please try again.';
          
          if (error.status === 401) {
            mensagemErro = 'Incorrect current password. Please verify.';
          } else if (error.error?.message) {
            mensagemErro = error.error.message;
          }
          
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: mensagemErro
          });
        }
      });
  }

  toggleSenha(campo: string): void {
    if (campo === 'senhaAtual') {
      this.senhaAtualVisivel = !this.senhaAtualVisivel;
    } else if (campo === 'novaSenha') {
      this.senhaVisivel = !this.senhaVisivel;
    } else if (campo === 'confirmacaoSenha') {
      this.confirmacaoVisivel = !this.confirmacaoVisivel;
    }
  }
}
