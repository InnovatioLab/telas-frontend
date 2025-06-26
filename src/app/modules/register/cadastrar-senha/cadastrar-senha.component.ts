import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { SenhaDirective } from '@app/core/directives/senha.directive';
import { ClientService } from '@app/core/service/api/client.service';
import { SenhaRequestDto } from '@app/model/dto/request/senha-request.dto';
import { CardCentralizadoComponent, ErrorComponent } from '@app/shared';
import { DialogoComponent } from '@app/shared/components/dialogo/dialogo.component';
import { IconsModule } from '@app/shared/icons/icons.module';
import { PrimengModule } from '@app/shared/primeng/primeng.module';
import { DialogoUtils } from '@app/shared/utils/dialogo-config.utils';
import { MascaraUtils } from '@app/shared/utils/mascara.utils';
import { MENSAGENS, MensagensConstants, TEXTO_ACAO } from '@app/utility/src';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';

@Component({
  selector: 'feat-cadastrar-senha',
  standalone: true,
  imports: [
    CommonModule,
    PrimengModule,
    CardCentralizadoComponent,
    ErrorComponent,
    ReactiveFormsModule,
    SenhaDirective,
    IconsModule
  ],
  providers: [DialogService],
  templateUrl: './cadastrar-senha.component.html',
  styleUrl: './cadastrar-senha.component.scss'
})
export class CadastrarSenhaComponent implements OnInit, OnDestroy {
  @Output() cadastroConcluído = new EventEmitter<string>();

  MENSAGENS: MensagensConstants = MENSAGENS;
  TEXTO_ACAO = TEXTO_ACAO;

  usuarioLogin: string;
  alterarContatoForm: FormGroup;
  usuarioID: string;
  preferenciaContato = 'PHONE';

  refDialogo: DynamicDialogRef | undefined;

  constructor(
    private readonly activatedRoute: ActivatedRoute,
    private readonly fb: FormBuilder,
    private readonly service: ClientService,
    public dialogService: DialogService
  ) {
    this.alterarContatoForm = this.fb.group({
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

  salvar() {
    if (this.alterarContatoForm.invalid) {
      this.alterarContatoForm.markAllAsTouched();
      this.alterarContatoForm.markAsDirty();
      return;
    }
    const senhas = new SenhaRequestDto(
      this.alterarContatoForm.value.senha,
      this.alterarContatoForm.value.confirmarSenha
    );

    this.service.criarSenha(this.usuarioLogin, senhas).subscribe(() => {
      this.exibirMensagemBoasVindas();
    });
  }

  exibirErroSenhaDiferente() {
    if (
      this.alterarContatoForm.get('confirmarSenha')?.dirty &&
      this.alterarContatoForm.get('senha')?.value !== this.alterarContatoForm.get('confirmarSenha')?.value
    ) {
      return true;
    }

    return false;
  }

  impedirColar(event: Event): void {
    event.preventDefault();
  }

  exibirDialogoAlerta(texto: string) {
    const config = DialogoUtils.exibirAlerta(texto, {
      acaoPrimariaCallback: () => {
        this.refDialogo?.close();
      }
    });

    this.refDialogo = this.dialogService.open(DialogoComponent, config);
  }

  aplicarMascaraNoDocumento(): void {
    if (this.usuarioLogin) {
      const tamanhoLogin = this.usuarioLogin.length;
      const cpfTamanho = 11;
      const cnpjTamanho = 14;

      let valorCampoLogin = '';

      if (tamanhoLogin === cpfTamanho) {
        valorCampoLogin = MascaraUtils.aplicarMascara(this.usuarioLogin, '999.999.999-99');
      }

      if (tamanhoLogin === cnpjTamanho) {
        valorCampoLogin = MascaraUtils.aplicarMascara(this.usuarioLogin, '99.999.999/9999-99');
      }

      this.alterarContatoForm.get('login')?.setValue(valorCampoLogin);
    }
  }

  exibirMensagemBoasVindas() {
    const config = DialogoUtils.exibirSucesso(MENSAGENS.dialogo.cadastroRealizadoSucesso, {
      acaoPrimariaCallback: () => {
        this.cadastroConcluído.emit(this.alterarContatoForm.value.senha);
        this.refDialogo.close();
      }
    });

    this.refDialogo = this.dialogService.open(DialogoComponent, {
      ...config,
      closeOnEscape: false,
      closable: false
    });
  }
}
