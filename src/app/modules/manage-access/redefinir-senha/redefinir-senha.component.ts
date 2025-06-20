import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SenhaDirective } from '@app/core/directives/senha.directive';
import { AutenticacaoService } from '@app/core/service/api/autenticacao.service';
import { SenhaRequestDto } from '@app/model/dto/request/senha-request.dto';
import { CardCentralizadoComponent, ErrorComponent } from '@app/shared';
import { DialogoComponent } from '@app/shared/components/dialogo/dialogo.component';
import { PrimengModule } from '@app/shared/primeng/primeng.module';
import { DialogoUtils } from '@app/shared/utils/dialogo-config.utils';
import { MENSAGENS, MensagensConstants, TEXTO_ACAO } from '@app/utility/src';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { AplicarMascaramentoUtils } from '@app/utility/src/lib/utils/aplicar-mascaramento.utils';

@Component({
  selector: 'feat-redefinir-senha',
  standalone: true,
  imports: [
    CommonModule,
    PrimengModule,
    CardCentralizadoComponent,
    ErrorComponent,
    ReactiveFormsModule,
    SenhaDirective
  ],
  providers: [DialogService],
  templateUrl: './redefinir-senha.component.html',
  styleUrl: './redefinir-senha.component.scss'
})
export class RedefinirSenhaComponent implements OnInit, OnDestroy {
  MENSAGENS: MensagensConstants = MENSAGENS;
  TEXTO_ACAO = TEXTO_ACAO;

  usuarioLogin: string;
  redefinirForm: FormGroup;
  usuarioID: string;
  preferenciaContato = 'WHATSAPP';

  refDialogo: DynamicDialogRef | undefined;

  constructor(
    private readonly activatedRoute: ActivatedRoute,
    private readonly fb: FormBuilder,
    private readonly router: Router,
    private readonly authService: AutenticacaoService,
    public dialogService: DialogService
  ) {
    this.redefinirForm = this.fb.group({
      login: [{ value: null, disabled: true }],
      senha: [null, Validators.required],
      confirmarSenha: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    this.activatedRoute.paramMap.subscribe(params => {
      this.usuarioLogin = params.get('login');

      this.aplicarMascaraNoDocumento();
    });
  }

  ngOnDestroy() {
    if (this.refDialogo) {
      this.refDialogo.close();
      this.refDialogo = undefined;
    }
  }

  navegarLogin() {
    this.router.navigate(['authentication/login']);
  }

  cancelar() {
    const mensagem = MENSAGENS.dialogo.cancelarRedefinirSenha;
    const config = DialogoUtils.exibirAlerta(mensagem, {
      acaoPrimaria: TEXTO_ACAO.simCancelar,
      acaoPrimariaCallback: () => {
        this.refDialogo?.close();
        this.navegarLogin();
      },

      acaoSecundaria: TEXTO_ACAO.naoVoltar,
      acaoSecundariaCallback: () => {
        this.refDialogo?.close();
      }
    });

    this.refDialogo = this.dialogService.open(DialogoComponent, config);
  }

  salvar() {
    if (this.redefinirForm.invalid) {
      this.redefinirForm.markAllAsTouched();
      return;
    }

    const senhas = new SenhaRequestDto(this.redefinirForm.value.senha, this.redefinirForm.value.confirmarSenha);

    this.authService.redefinirSenha(this.usuarioLogin, senhas).subscribe(() => {
      this.exibirMensagemSucesso();
    });
  }

  exibirErroSenhaDiferente() {
    if (
      this.redefinirForm.get('confirmarSenha')?.dirty &&
      this.redefinirForm.get('senha')?.value !== this.redefinirForm.get('confirmarSenha')?.value
    ) {
      return true;
    }

    return false;
  }

  impedirColar(event: Event): void {
    event.preventDefault();
  }

  aplicarMascaraNoDocumento(): void {
    if (this.usuarioLogin) {
      const valorCampoLogin = AplicarMascaramentoUtils.aplicarMascaraDocumento(this.usuarioLogin);
      this.redefinirForm.get('login')?.setValue(valorCampoLogin);
    }
  }

  exibirMensagemSucesso() {
    const config = DialogoUtils.exibirSucesso(MENSAGENS.dialogo.senhaRedefinida, {
      acaoPrimariaCallback: () => {
        this.refDialogo.close();
        this.navegarLogin();
      }
    });

    this.refDialogo = this.dialogService.open(DialogoComponent, {
      ...config,
      closeOnEscape: false,
      closable: false
    });
  }
}
