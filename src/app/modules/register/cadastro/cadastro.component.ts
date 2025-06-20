import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { DialogoUtils } from '@app/shared/utils/dialogo-config.utils';
import { MenuItem } from 'primeng/api';
import { CLIENT_FORM } from '@app/shared/constants/campos-cadastro.constants';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { ALL_STEPS, USER_TYPE_STEPS, userFriendlyNames } from '@app/shared/constants/etapas-cadastro.constants';
import { AbstractControlUtils } from '@app/shared/utils/abstract-control.utils';
import { normalizePhoneNumber } from '@app/utility/src/lib/utils/normalize-inputs.utils';
import { ClientRequestDTO } from '@app/model/dto/request/client-request.dto';
import { PrimengModule } from '@app/shared/primeng/primeng.module';
import { MENSAGENS } from '@app/utility/src';
import { FormCadastro } from './utils/form-cadastro';
import { FormEnderecoComponent } from '@app/shared/components/forms/form-endereco/form-endereco.component';
import { FormDadosPessoaisComponent } from '@app/shared/components/forms/form-dados-pessoais/form-dados-pessoais.component';
import { ButtonFooterComponent } from '@app/shared/components/button-footer/button-footer.component';
import { FormContatoComponent } from '@app/shared/components/forms/form-contato/form-contato.component';
import { DialogoComponent } from '@app/shared/components/dialogo/dialogo.component';
import { LoadingService } from '@app/core/service/state/loading.service';
import { ClientService } from '@app/core/service/api/client.service';
import { IconsModule } from '@app/shared/icons/icons.module';

@Component({
  selector: 'feat-cadastro',
  standalone: true,
  imports: [
    CommonModule,
    PrimengModule,
    FormEnderecoComponent,
    FormDadosPessoaisComponent,
    ButtonFooterComponent,
    FormContatoComponent,
    IconsModule
  ],
  providers: [DialogService, DialogoUtils],
  templateUrl: './cadastro.component.html',
  styleUrl: './cadastro.component.scss'
})
export class CadastroComponent implements OnInit {
  ref: DynamicDialogRef | undefined;
  formCadastro: FormCadastro;
  items: MenuItem[] = [];
  headerText: string;
  listaCampos: string[] = CLIENT_FORM['CLIENT'];
  habilitarFormDados: boolean;
  tipoUsuarioSelecionado: string | undefined;

  habilitarBotaoSalvar = true;
  txtBtnProximo = 'Finish';

  latitude: string | null = null;
  longitude: string | null = null;

  constructor(
    private readonly fb: FormBuilder,
    private readonly router: Router,
    public dialogService: DialogService,
    private readonly loadingService: LoadingService,
    private readonly clientService: ClientService
  ) {}

  ngOnInit() {
    this.items = this.getStepsForUserType('CLIENT');
    this.headerText = userFriendlyNames['CLIENT']; 
    this.iniciarForm();
    this.controleTipoUsuarioInicio();
  }

  controleTipoUsuarioInicio() {
    this.habilitarFormDados = false;
  }

  iniciarForm() {
    this.formCadastro = new FormCadastro(this.fb);

    if (!this.formCadastro.cadastroForm.get('dadosCliente')) {
      this.formCadastro.cadastroForm.addControl('dadosCliente', this.fb.group({
        businessName: [''],
        identificationNumber: [''],
        industry: [''],
        websiteUrl: [''],
        socialMedia: this.fb.array([])
      }));
    }
    if (!this.formCadastro.cadastroForm.get('enderecoCliente')) {
      this.formCadastro.cadastroForm.addControl('enderecoCliente', this.fb.group({
        zipCode: [''],
        street: [''],
        city: [''],
        state: [''],
        country: [''],
        complement: ['']
      }));
    }
    if (!this.formCadastro.cadastroForm.get('contato')) {
      this.formCadastro.cadastroForm.addControl('contato', this.fb.group({
        numeroContato: [''],
        email: ['']
      }));
    }
  }

  get dadosPessoaisForm(): FormGroup {
    return this.formCadastro.cadastroForm.get('dadosCliente') as FormGroup;
  }

  get enderecoForm(): FormGroup {
    return this.formCadastro.cadastroForm.get('enderecoCliente') as FormGroup;
  }

  get contatoForm(): FormGroup {
    return this.formCadastro.cadastroForm.get('contato') as FormGroup;
  }

  getStepsForUserType(userType: string): MenuItem[] {
    const stepKeys = USER_TYPE_STEPS[userType] || [];
    return ALL_STEPS.filter((step: any) => stepKeys.includes(step.key)).map((step: any) => ({
      label: step.label,
      command: step.command
    }));
  }

  atualizarTipoUsuarioSelecionado(novoTipo: string) {
    this.tipoUsuarioSelecionado = novoTipo;
    AbstractControlUtils.resetFormExcludingField(this.dadosPessoaisForm, 'tipoUsuario');

    this.enderecoForm.reset();
    this.contatoForm.reset();

    this.listaCampos = CLIENT_FORM['CLIENT'];
    this.items = this.getStepsForUserType('CLIENT');
  }

  salvar(form: FormGroup) {
    if (form.valid) {
      this.habilitarBotaoSalvar = false;
      this.loadingService.setLoading(true, 'salvarCadastro');
      const IGNORAR_LOADING = true;

      const dadosCliente = form.get('dadosCliente')?.value ?? {};
      const enderecoCliente = form.get('enderecoCliente')?.value ?? {};
      const contato = form.get('contato')?.value ?? {};

      const rawPhone = contato.numeroContato ?? '';
      const normalizedPhone = normalizePhoneNumber(rawPhone);
      
      const socialMedia: Record<string, string> = {};
      if (dadosCliente.socialMedia && Array.isArray(dadosCliente.socialMedia) && dadosCliente.socialMedia.length > 0) {
        dadosCliente.socialMedia.forEach((item: { platform: string; url: string }) => {
          if (item.platform && item.url) {
            socialMedia[`${item.platform}Url`] = item.url;
          }
        });
      }

      const clientRequest: ClientRequestDTO = {
        businessName: dadosCliente.businessName,
        identificationNumber: dadosCliente.identificationNumber,
        industry: dadosCliente.industry,
        websiteUrl: dadosCliente.websiteUrl,
        socialMedia: Object.keys(socialMedia).length > 0 ? socialMedia : undefined,
        contact: {
          email: contato.email,
          phone: normalizedPhone
        },
        owner: {
          identificationNumber: dadosCliente.identificationNumber,
          firstName: dadosCliente.businessName?.split(' ')[0] ?? '',
          lastName: dadosCliente.businessName?.split(' ').slice(1).join(' ') ?? '',
          email: contato.email,
          phone: normalizedPhone
        },
        addresses: [
          {
            complement: enderecoCliente.complement ?? '',
            street: enderecoCliente.street,
            city: enderecoCliente.city,
            state: enderecoCliente.state,
            country: enderecoCliente.country,
            zipCode: enderecoCliente.zipCode,
          },
        ],
      };


      this.clientService.save(clientRequest, IGNORAR_LOADING).subscribe({
        next: (response: unknown) => {
          if (response) {
            this.habilitarBotaoSalvar = true;
            this.loadingService.setLoading(false, 'salvarCadastro');
            this.navegarValidacao(clientRequest.identificationNumber);
          }
        },
        error: () => {
          this.habilitarBotaoSalvar = true;
          this.loadingService.setLoading(false, 'salvarCadastro');
        }
      });
    } else {
      console.log('Formulário inválido', form);
      this.formCadastro.cadastroForm.markAllAsTouched();
    }
  }

  proximoStap() {
    console.log('Form state:', {
      dadosPessoais: this.dadosPessoaisForm.value,
      dadosPessoaisValid: this.dadosPessoaisForm.valid,
      endereco: this.enderecoForm.value,
      enderecoValid: this.enderecoForm.valid,
      contato: this.contatoForm.value,
      contatoValid: this.contatoForm.valid
    });

    this.dadosPessoaisForm.updateValueAndValidity();
    this.enderecoForm.updateValueAndValidity();
    this.contatoForm.updateValueAndValidity();

    const dadosPessoaisValid = this.dadosPessoaisForm.valid;
    const enderecoValid = this.enderecoForm.valid;
    const contatoValid = this.contatoForm.valid;

    if (!dadosPessoaisValid || !enderecoValid || !contatoValid) {
      console.log('Formulários inválidos:', {
        dadosPessoaisValid,
        enderecoValid,
        contatoValid,
        contatoErrors: this.contatoForm.errors
      });
      
      this.dadosPessoaisForm.markAllAsTouched();
      this.dadosPessoaisForm.markAsDirty();
      this.enderecoForm.markAllAsTouched();
      this.enderecoForm.markAsDirty();
      this.contatoForm.markAllAsTouched();
      this.contatoForm.markAsDirty();
      return;
    }
    
    this.salvar(this.formCadastro.cadastroForm);
  }

  anteriorStap() {
    this.router.navigate(['/register']);
  }

  mostrarAviso() {
    return true;
  }

  voltarHome() {
    this.router.navigate(['/']);
  }

  navegarValidacao(documento: string) {
    this.router.navigate(['register/validate/' + documento]);
  }

  formaDeContatoPrincipal(): string {
    return this.contatoForm.get('email')?.value ?? '';
  }

  mensagemSalvarDialog() {
    const email = this.formaDeContatoPrincipal();

    let descricao = '';
    descricao = MENSAGENS.dialogo.envioCodigoValidacaoEmail.replace('{var}', email);

    const config = DialogoUtils.criarConfig({
      titulo: 'Success!',
      descricao: descricao,
      icon: 'check_circle',
      acaoPrimaria: 'Ok',
      acaoPrimariaCallback: () => {
        this.ref.close();
      }
    });
    this.ref = this.dialogService.open(DialogoComponent, config);
  }

  mensagemCancelarDialog() {
    const config = DialogoUtils.exibirAlerta(MENSAGENS.dialogo.cancelar, {
      acaoPrimaria: 'Yes, leave',
      acaoPrimariaCallback: () => {
        this.cancelarForm();
        this.ref.close();
        this.voltarHome();
      },
      acaoSecundaria: 'No, stay',
      acaoSecundariaCallback: () => {
        this.ref.close();
      }
    });
    this.ref = this.dialogService.open(DialogoComponent, config);
  }

  cancelarForm() {
    this.dadosPessoaisForm.reset();
    this.contatoForm.reset();
    this.enderecoForm.reset();
  }
}