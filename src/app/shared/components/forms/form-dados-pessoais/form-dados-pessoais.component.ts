import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TextOnlyDirective } from '@app/core/directives/text-only.directive';
import { PrimengModule } from '@app/shared/primeng/primeng.module';
import { AbstractControlUtils } from '@app/shared/utils/abstract-control.utils';
import { DialogoUtils } from '@app/shared/utils/dialogo-config.utils';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { DialogoComponent } from '../../dialogo/dialogo.component';
import { ErrorComponent } from '../../error/error.component';

@Component({
  selector: 'ui-form-dados-pessoais',
  standalone: true,
  imports: [
    CommonModule,
    PrimengModule,
    ReactiveFormsModule,
    ErrorComponent,
    TextOnlyDirective
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
        platform: [null, Validators.required], 
        url: [null, [
          Validators.required,
          Validators.maxLength(200), 
          Validators.pattern(/^(https?:\/\/)[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+(:\d+)?(\/\S*)?$/)
        ]],
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
    AbstractControlUtils.atualizatualizarValidators(this.cadastroForm, 'industry', [
      Validators.maxLength(50),
      Validators.pattern('^[a-zA-ZÀ-ÖØ-öø-ÿ\\s]*$'),
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
