import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { PrimengModule } from '@app/shared/primeng/primeng.module';
import { CardCentralizadoComponent, ErrorComponent } from '@app/shared';
import { DialogoUtils } from '@app/shared/utils/dialogo-config.utils';
import { MENSAGENS, TEXTO_ACAO } from '@app/utility/src';
import { AbstractControlUtils } from '@app/shared/utils/abstract-control.utils';
import { DialogoComponent } from '@app/shared/components/dialogo/dialogo.component';
import { ClientService } from '@app/core/service/api/client.service';
import { AutenticacaoService } from '@app/core/service/api/autenticacao.service';

@Component({
  selector: 'feat-recuperar-senha',
  standalone: true,
  imports: [
    CommonModule,
    PrimengModule,
    CardCentralizadoComponent,
    ErrorComponent,
    ReactiveFormsModule,
  ],
  providers: [DialogService, DialogoUtils],
  templateUrl: './recuperar-senha.component.html',
  styleUrl: './recuperar-senha.component.scss'
})
export class RecuperarSenhaComponent {
  refDialogo: DynamicDialogRef | undefined;
  MENSAGENS = MENSAGENS;
  TEXTO_ACAO = TEXTO_ACAO;

  form: FormGroup;

  constructor(
    private readonly fb: FormBuilder,
    private readonly router: Router,
    private readonly clientService: ClientService,
    private readonly authService: AutenticacaoService,
    public dialogService: DialogService
  ) {
    this.form = this.fb.group({
      login: [null, [Validators.required]]
    });
  }

  mostrarErro(campo: string): boolean {
    return AbstractControlUtils.verificarCampoInvalidoTocado(this.form, campo);
  }

  voltar() {
    this.router.navigate(['/login']);
  }

  proximo() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.buscarClient(this.form.get('login')?.value);
  }

  buscarClient(login: string) {
    this.clientService.buscaClientPorIdentificador(login).subscribe(resposta => {
      if (resposta) {
        this.redirecionarValidacaoCadastro(login);
      } else {
        this.exibirAlerta(MENSAGENS.dialogo.naoEncontradoIdentificador);
      }
    });
  }

  exibirAlerta(mensagem: string) {
    const config = DialogoUtils.exibirAlerta(mensagem, {
      acaoPrimariaCallback: () => {
        this.refDialogo.close();
      }
    });

    this.refDialogo = this.dialogService.open(DialogoComponent, config);
  }

  recuperarSenha() {
    const login = this.form.get('login')?.value;
    this.authService.recuperarSenha(login).subscribe(res => {
      if (res) {
        this.redirecionarValidacaoRecuperar(login);
      }
    });
  }

  redirecionarValidacaoRecuperar(login: string) {
    this.router.navigate(['auth/validate-code-recover-password', login]);
  }

  reenviarCodigo() {
    const login = this.form.get('login')?.value;
    this.clientService.reenvioCodigo(login).subscribe(res => {
      if (res) {
        this.redirecionarValidacaoCadastro(login);
      }
    });
  }

  redirecionarValidacaoCadastro(login: string) {
    this.router.navigate(['/register/validate-code-recover-password', login]);
  }

  onlyNumbersInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/\D/g, '');
    this.form.get('login').setValue(input.value);
  }
}
