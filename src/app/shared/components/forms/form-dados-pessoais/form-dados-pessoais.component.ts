import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule, Validators, FormArray, FormBuilder } from '@angular/forms';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { PrimengModule } from '@app/shared/primeng/primeng.module';
import { ErrorComponent } from '../../error/error.component';
import { DialogoUtils } from '@app/shared/utils/dialogo-config.utils';
import { ClientService } from '@app/core/service/client.service';
import { ENVIRONMENT } from 'src/environments/environment-token';
import { AbstractControlUtils } from '@app/shared/utils/abstract-control.utils';
import { DialogoComponent } from '../../dialogo/dialogo.component';

@Component({
  selector: 'ui-form-dados-pessoais',
  standalone: true,
  imports: [
    CommonModule,
    PrimengModule,
    ReactiveFormsModule,
    ErrorComponent,
  ],
  providers: [DialogService, DialogoUtils],
  templateUrl: './form-dados-pessoais.component.html',
  styleUrl: './form-dados-pessoais.component.scss'
})
export class FormDadosPessoaisComponent implements OnInit {
  ref: DynamicDialogRef | undefined;
  @Input() cadastroForm: FormGroup;
  @Input() habilitarFormDados: boolean;
  @Output() tipoUsuarioSelecionado = new EventEmitter<string>();
  @Input() listaCampos: string[];
  private readonly clientService = inject(ClientService);
  private readonly env = inject(ENVIRONMENT);

  dataMaxima: Date;
  dataMinima: Date;

  socialMediaOptions = [
    { label: 'Instagram', value: 'instagram' },
    { label: 'Facebook', value: 'facebook' },
    { label: 'LinkedIn', value: 'linkedin' },
    { label: 'X (Twitter)', value: 'x' },
    { label: 'TikTok', value: 'tiktok' },
  ];

  constructor(public dialogService: DialogService, private readonly fb: FormBuilder) {}

  ngOnInit(): void {
    this.observarTipoUsuario();
  }

  get socialMediaArray(): FormArray {
    return this.cadastroForm.get('socialMedia') as FormArray;
  }

  adicionarSocialMedia() {
    this.socialMediaArray.push(
      this.fb.group({
        platform: [null], 
        url: [null, [Validators.maxLength(200), Validators.pattern(/^(https?:\/\/).+/)]],
      })
    );
  }

  removerSocialMedia(index: number) {
    this.socialMediaArray.removeAt(index);
  }

  removerUltimoSocialMedia() {
    if (this.socialMediaArray.length > 0) {
      this.socialMediaArray.removeAt(this.socialMediaArray.length - 1);
    }
  }

  observarTipoUsuario() {
    this.cadastroForm.get('tipoUsuario')?.valueChanges.subscribe(tipo => {
      if (tipo) {
        this.tipoUsuarioSelecionado.emit(this.cadastroForm.get('tipoUsuario').value);
      }
    });
  }

  habilitarDados(): boolean {
    return this.habilitarFormDados;
  }

  atualizarValidacaoPessoaJuridica() {
    AbstractControlUtils.atualizatualizarValidators(this.cadastroForm, 'identificationNumber', [
      Validators.required,
      Validators.minLength(9),
      Validators.maxLength(9),
      Validators.pattern('^[0-9]{9}$')
    ]);
    AbstractControlUtils.atualizatualizarValidators(this.cadastroForm, 'businessField', [
      Validators.maxLength(100),
      Validators.required
    ]);
    AbstractControlUtils.atualizatualizarValidators(this.cadastroForm, 'websiteUrl', [
      Validators.maxLength(200),
      Validators.pattern('https?://.+')
    ]);
  }

  exibirCampo(campo: string): boolean {
    return this.listaCampos?.includes(campo);
  }

  mostrarErro(campo: string): boolean {
    return AbstractControlUtils.verificarCampoInvalidoTocado(this.cadastroForm, campo);
  }

  campoObrigatorio(campo: string): boolean {
    return AbstractControlUtils.verificarCampoRequired(this.cadastroForm, campo);
  }

  mensagemAlertaLimparCampo(mensagem: string, campo: string) {
    const config = DialogoUtils.exibirAlerta(mensagem, {
      acaoPrimariaCallback: () => {
        this.ref.close();
        AbstractControlUtils.limparCampo(this.cadastroForm, campo);
      }
    });
    this.ref = this.dialogService.open(DialogoComponent, config);
  }

  onDropdownOpen(controlName: string) {
    const control = this.cadastroForm.get(controlName);
    if (control) {
      control.markAsUntouched();
    }
  }

  onDropdownClose(controlName: string) {
    const control = this.cadastroForm.get(controlName);
    if (control && !control.value) {
      control.markAsTouched();
    }
  }
}
