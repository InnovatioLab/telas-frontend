import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup } from "@angular/forms";
import { ClientProfileFormFactory } from "@app/shared/forms/client-profile-form.factory";
import { AbstractControlUtils } from "@app/shared/utils/abstract-control.utils";
import { Router } from "@angular/router";
import { ClientService } from "@app/core/service/api/client.service";
import { LoadingService } from "@app/core/service/state/loading.service";
import { ClientRequestDTO } from "@app/model/dto/request/client-request.dto";
import { ButtonFooterComponent } from "@app/shared/components/button-footer/button-footer.component";
import { DialogComponent } from "@app/shared/components/dialog/dialog.component";
import { ContactFormComponent } from "@app/shared/components/forms/contact-form/contact-form.component";
import { PersonalDataFormComponent } from "@app/shared/components/forms/personal-data-form/personal-data-form.component";
import { AddressFormComponent } from "@app/shared/components/forms/address-form/address-form.component";
import { CLIENT_FORM } from "@app/shared/constants/registration-fields.constants";
import {
  ALL_STEPS,
  USER_TYPE_STEPS,
  userFriendlyNames,
} from "@app/shared/constants/registration-steps.constants";
import { IconsModule } from "@app/shared/icons/icons.module";
import { PrimengModule } from "@app/shared/primeng/primeng.module";
import { DialogUtils } from "@app/shared/utils/dialog-config.utils";
import { MESSAGES } from "@app/utility/src";
import { MenuItem } from "primeng/api";
import { DialogService, DynamicDialogRef } from "primeng/dynamicdialog";
import { RegistrationForm } from "./utils/registration-form";

@Component({
  selector: "feat-registration",
  standalone: true,
  imports: [
    CommonModule,
    PrimengModule,
    AddressFormComponent,
    PersonalDataFormComponent,
    ButtonFooterComponent,
    ContactFormComponent,
    IconsModule,
  ],
  providers: [DialogService, DialogUtils],
  templateUrl: "./registration.component.html",
  styleUrl: "./registration.component.scss",
})
export class RegistrationComponent implements OnInit {
  ref: DynamicDialogRef | undefined;
  formHelper: RegistrationForm;
  items: MenuItem[] = [];
  headerText: string;
  fieldList: string[] = CLIENT_FORM["CLIENT"];
  habilitarFormDados: boolean;
  selectedUserType: string | undefined;

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
    this.formHelper = new RegistrationForm(this.fb);

    if (!this.formHelper.registrationForm.get("clientData")) {
      this.formHelper.registrationForm.addControl(
        "clientData",
        ClientProfileFormFactory.createBusinessFieldsGroup(this.fb)
      );
    }
    if (!this.formHelper.registrationForm.get("clientAddress")) {
      this.formHelper.registrationForm.addControl(
        "clientAddress",
        ClientProfileFormFactory.createSingleAddressGroup(this.fb, {
          strictZipCode: true,
        })
      );
    }
    if (!this.formHelper.registrationForm.get("contact")) {
      this.formHelper.registrationForm.addControl(
        "contact",
        ClientProfileFormFactory.createContactGroup(this.fb, "registration")
      );
    }
  }

  get personalDataForm(): FormGroup {
    return this.formHelper.registrationForm.get("clientData") as FormGroup;
  }

  get addressForm(): FormGroup {
    return this.formHelper.registrationForm.get("clientAddress") as FormGroup;
  }

  get contactForm(): FormGroup {
    return this.formHelper.registrationForm.get("contact") as FormGroup;
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

  updateSelectedUserType(newType: string) {
    this.selectedUserType = newType;
    AbstractControlUtils.resetFormExcludingField(
      this.personalDataForm,
      "userType"
    );

    this.addressForm.reset();
    this.contactForm.reset();

    this.fieldList = CLIENT_FORM["CLIENT"];
    this.items = this.getStepsForUserType("CLIENT");
  }

  save(form: FormGroup) {
    if (form.valid) {
      this.habilitarBotaoSalvar = false;
      this.loadingService.setLoading(true, "saveRegistration");
      const IGNORAR_LOADING = true;

      const clientData = form.get("clientData")?.value ?? {};
      const clientAddress = form.get("clientAddress")?.value ?? {};
      const contactData = form.get("contact")?.value ?? {};

      const rawPhone = contactData.numeroContato ?? "";

      const socialMedia: Record<string, string> = {};
      if (
        clientData.socialMedia &&
        Array.isArray(clientData.socialMedia) &&
        clientData.socialMedia.length > 0
      ) {
        clientData.socialMedia.forEach(
          (item: { platform: string; url: string }) => {
            if (item.platform && item.url) {
              socialMedia[`${item.platform}Url`] = item.url;
            }
          }
        );
      }

      const clientRequest: ClientRequestDTO = {
        businessName: clientData.businessName,
        industry: clientData.industry,
        websiteUrl: clientData.websiteUrl ?? null,
        socialMedia: Object.keys(socialMedia).length > 0 ? socialMedia : null,
        contact: {
          email: contactData.email,
          phone: rawPhone,
        },
        addresses: [
          {
            address2: clientAddress.address2 ?? null,
            street: clientAddress.street,
            city: clientAddress.city,
            state: clientAddress.state,
            country: clientAddress.country ?? null,
            zipCode: clientAddress.zipCode,
            latitude: this.latitude ? parseFloat(this.latitude) : undefined,
            longitude: this.longitude ? parseFloat(this.longitude) : undefined,
          },
        ],
      };

      this.clientService.save(clientRequest, IGNORAR_LOADING).subscribe({
        next: (response: unknown) => {
          if (response) {
            this.habilitarBotaoSalvar = true;
            this.loadingService.setLoading(false, "saveRegistration");
            this.navegarValidacao(clientRequest.contact.email);
          }
        },
        error: () => {
          this.habilitarBotaoSalvar = true;
          this.loadingService.setLoading(false, "saveRegistration");
        },
      });
    } else {
      this.markFormGroupTouched(form);
    }
  }

  proximoStap() {
    this.personalDataForm.updateValueAndValidity();
    this.addressForm.updateValueAndValidity();
    this.contactForm.updateValueAndValidity();

    const dadosPessoaisValid = this.personalDataForm.valid;
    const enderecoValid = this.addressForm.valid;
    const contatoValid = this.contactForm.valid;

    if (!dadosPessoaisValid || !enderecoValid || !contatoValid) {
      this.personalDataForm.markAllAsTouched();
      this.personalDataForm.markAsDirty();
      this.addressForm.markAllAsTouched();
      this.addressForm.markAsDirty();
      this.contactForm.markAllAsTouched();
      this.contactForm.markAsDirty();
      return;
    }

    this.save(this.formHelper.registrationForm);
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
    return this.contactForm.get("email")?.value ?? "";
  }

  saveDialogMessage() {
    const email = this.formaDeContatoPrincipal();

    let descricao = "";
    descricao = MESSAGES.dialog.validationCodeSentEmail.replace(
      "{var}",
      email
    );

    const config = DialogUtils.createConfig({
      title: "Success!",
      description: descricao,
      icon: "check_circle",
      primaryAction: "Ok",
      primaryActionCallback: () => {
        this.ref.close();
      },
    });
    this.ref = this.dialogService.open(DialogComponent, config);
  }

  cancelDialogMessage() {
    const config = DialogUtils.showAlert(MESSAGES.dialog.cancel, {
      primaryAction: "Yes, leave",
      primaryActionCallback: () => {
        this.cancelarForm();
        this.ref.close();
        this.voltarHome();
      },
      secondaryAction: "No, stay",
      secondaryActionCallback: () => {
        this.ref.close();
      },
    });
    this.ref = this.dialogService.open(DialogComponent, config);
  }

  cancelarForm() {
    this.personalDataForm.reset();
    this.contactForm.reset();
    this.addressForm.reset();
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
