import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { ClientService } from "@app/core/service/api/client.service";
import { LoadingService } from "@app/core/service/state/loading.service";
import { ClientRequestDTO } from "@app/model/dto/request/client-request.dto";
import { ButtonFooterComponent } from "@app/shared/components/button-footer/button-footer.component";
import { DialogoComponent } from "@app/shared/components/dialogo/dialogo.component";
import { FormContatoComponent } from "@app/shared/components/forms/form-contato/form-contato.component";
import { FormDadosPessoaisComponent } from "@app/shared/components/forms/form-dados-pessoais/form-dados-pessoais.component";
import { FormEnderecoComponent } from "@app/shared/components/forms/form-endereco/form-endereco.component";
import { CLIENT_FORM } from "@app/shared/constants/campos-cadastro.constants";
import {
  ALL_STEPS,
  USER_TYPE_STEPS,
  userFriendlyNames,
} from "@app/shared/constants/etapas-cadastro.constants";
import { IconsModule } from "@app/shared/icons/icons.module";
import { PrimengModule } from "@app/shared/primeng/primeng.module";
import { AbstractControlUtils } from "@app/shared/utils/abstract-control.utils";
import { DialogoUtils } from "@app/shared/utils/dialogo-config.utils";
import { MENSAGENS } from "@app/utility/src";
import { MenuItem } from "primeng/api";
import { DialogService, DynamicDialogRef } from "primeng/dynamicdialog";
import { FormCadastro } from "./utils/form-cadastro";

@Component({
  selector: "feat-cadastro",
  standalone: true,
  imports: [
    CommonModule,
    PrimengModule,
    FormEnderecoComponent,
    FormDadosPessoaisComponent,
    ButtonFooterComponent,
    FormContatoComponent,
    IconsModule,
  ],
  providers: [DialogService, DialogoUtils],
  templateUrl: "./cadastro.component.html",
  styleUrl: "./cadastro.component.scss",
})
export class CadastroComponent implements OnInit {
  ref: DynamicDialogRef | undefined;
  formCadastro: FormCadastro;
  items: MenuItem[] = [];
  headerText: string;
  listaCampos: string[] = CLIENT_FORM["CLIENT"];
  habilitarFormDados: boolean;
  tipoUsuarioSelecionado: string | undefined;

  habilitarBotaoSalvar = true;
  txtBtnProximo = "Finish";

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
    this.items = this.getStepsForUserType("CLIENT");
    this.headerText = userFriendlyNames["CLIENT"];
    this.iniciarForm();
    this.controleTipoUsuarioInicio();
  }

  controleTipoUsuarioInicio() {
    this.habilitarFormDados = false;
  }

  iniciarForm() {
    this.formCadastro = new FormCadastro(this.fb);

    if (!this.formCadastro.cadastroForm.get("dadosCliente")) {
      this.formCadastro.cadastroForm.addControl(
        "dadosCliente",
        this.fb.group({
          businessName: ["", [Validators.required, Validators.maxLength(255)]],
          industry: ["", [Validators.maxLength(50)]],
          websiteUrl: [
            "",
            [Validators.maxLength(255), AbstractControlUtils.validateUrl()],
          ],
          socialMedia: this.fb.array([]),
        })
      );
    }
    if (!this.formCadastro.cadastroForm.get("enderecoCliente")) {
      this.formCadastro.cadastroForm.addControl(
        "enderecoCliente",
        this.fb.group({
          zipCode: ["", [Validators.required, Validators.pattern(/^\d{5}$/)]],
          street: [
            "",
            [
              Validators.required,
              Validators.maxLength(100),
              AbstractControlUtils.validateStreet(),
            ],
          ],
          city: ["", [Validators.required, Validators.maxLength(50)]],
          state: [
            "",
            [
              Validators.required,
              Validators.maxLength(2),
              Validators.minLength(2),
            ],
          ],
          country: ["US", [Validators.maxLength(100)]],
          address2: ["", Validators.maxLength(100)],
        })
      );
    }
    if (!this.formCadastro.cadastroForm.get("contato")) {
      this.formCadastro.cadastroForm.addControl(
        "contato",
        this.fb.group({
          numeroContato: [
            "",
            [Validators.required, AbstractControlUtils.validatePhone()],
          ],
          email: [
            "",
            [Validators.required, Validators.email, Validators.maxLength(255)],
          ],
        })
      );
    }
  }

  get dadosPessoaisForm(): FormGroup {
    return this.formCadastro.cadastroForm.get("dadosCliente") as FormGroup;
  }

  get enderecoForm(): FormGroup {
    return this.formCadastro.cadastroForm.get("enderecoCliente") as FormGroup;
  }

  get contatoForm(): FormGroup {
    return this.formCadastro.cadastroForm.get("contato") as FormGroup;
  }

  getStepsForUserType(userType: string): MenuItem[] {
    const stepKeys = USER_TYPE_STEPS[userType] || [];
    return ALL_STEPS.filter((step: any) => stepKeys.includes(step.key)).map(
      (step: any) => ({
        label: step.label,
        command: step.command,
      })
    );
  }

  atualizarTipoUsuarioSelecionado(novoTipo: string) {
    this.tipoUsuarioSelecionado = novoTipo;
    AbstractControlUtils.resetFormExcludingField(
      this.dadosPessoaisForm,
      "tipoUsuario"
    );

    this.enderecoForm.reset();
    this.contatoForm.reset();

    this.listaCampos = CLIENT_FORM["CLIENT"];
    this.items = this.getStepsForUserType("CLIENT");
  }

  salvar(form: FormGroup) {
    if (form.valid) {
      this.habilitarBotaoSalvar = false;
      this.loadingService.setLoading(true, "salvarCadastro");
      const IGNORAR_LOADING = true;

      const dadosCliente = form.get("dadosCliente")?.value ?? {};
      const enderecoCliente = form.get("enderecoCliente")?.value ?? {};
      const contato = form.get("contato")?.value ?? {};

      const rawPhone = contato.numeroContato ?? "";

      const socialMedia: Record<string, string> = {};
      if (
        dadosCliente.socialMedia &&
        Array.isArray(dadosCliente.socialMedia) &&
        dadosCliente.socialMedia.length > 0
      ) {
        dadosCliente.socialMedia.forEach(
          (item: { platform: string; url: string }) => {
            if (item.platform && item.url) {
              socialMedia[`${item.platform}Url`] = item.url;
            }
          }
        );
      }

      const clientRequest: ClientRequestDTO = {
        businessName: dadosCliente.businessName,
        industry: dadosCliente.industry,
        websiteUrl: dadosCliente.websiteUrl ?? null,
        socialMedia: Object.keys(socialMedia).length > 0 ? socialMedia : null,
        contact: {
          email: contato.email,
          phone: rawPhone,
        },
        addresses: [
          {
            address2: enderecoCliente.address2 ?? null,
            street: enderecoCliente.street,
            city: enderecoCliente.city,
            state: enderecoCliente.state,
            country: enderecoCliente.country ?? null,
            zipCode: enderecoCliente.zipCode,
          },
        ],
      };

      this.clientService.save(clientRequest, IGNORAR_LOADING).subscribe({
        next: (response: unknown) => {
          if (response) {
            this.habilitarBotaoSalvar = true;
            this.loadingService.setLoading(false, "salvarCadastro");
            this.navegarValidacao(clientRequest.contact.email);
          }
        },
        error: () => {
          this.habilitarBotaoSalvar = true;
          this.loadingService.setLoading(false, "salvarCadastro");
        },
      });
    } else {
      console.log("Form is invalid, invalid fields:", form.errors);
      this.markFormGroupTouched(form);
    }
  }

  proximoStap() {
    this.dadosPessoaisForm.updateValueAndValidity();
    this.enderecoForm.updateValueAndValidity();
    this.contatoForm.updateValueAndValidity();

    const dadosPessoaisValid = this.dadosPessoaisForm.valid;
    const enderecoValid = this.enderecoForm.valid;
    const contatoValid = this.contatoForm.valid;

    if (!dadosPessoaisValid || !enderecoValid || !contatoValid) {
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
    this.router.navigate(["/register"]);
  }

  mostrarAviso() {
    return true;
  }

  voltarHome() {
    this.router.navigate(["/"]);
  }

  navegarValidacao(documento: string) {
    this.router.navigate(["register/validate/" + documento]);
  }

  formaDeContatoPrincipal(): string {
    return this.contatoForm.get("email")?.value ?? "";
  }

  mensagemSalvarDialog() {
    const email = this.formaDeContatoPrincipal();

    let descricao = "";
    descricao = MENSAGENS.dialogo.envioCodigoValidacaoEmail.replace(
      "{var}",
      email
    );

    const config = DialogoUtils.criarConfig({
      titulo: "Success!",
      descricao: descricao,
      icon: "check_circle",
      acaoPrimaria: "Ok",
      acaoPrimariaCallback: () => {
        this.ref.close();
      },
    });
    this.ref = this.dialogService.open(DialogoComponent, config);
  }

  mensagemCancelarDialog() {
    const config = DialogoUtils.exibirAlerta(MENSAGENS.dialogo.cancelar, {
      acaoPrimaria: "Yes, leave",
      acaoPrimariaCallback: () => {
        this.cancelarForm();
        this.ref.close();
        this.voltarHome();
      },
      acaoSecundaria: "No, stay",
      acaoSecundariaCallback: () => {
        this.ref.close();
      },
    });
    this.ref = this.dialogService.open(DialogoComponent, config);
  }

  cancelarForm() {
    this.dadosPessoaisForm.reset();
    this.contatoForm.reset();
    this.enderecoForm.reset();
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else {
        control?.markAsTouched();
      }
    });
  }
}
