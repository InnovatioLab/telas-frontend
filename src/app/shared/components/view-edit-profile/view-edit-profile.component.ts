import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component, OnInit } from "@angular/core";
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
} from "@angular/forms";
import { ClientProfileFormFactory } from "@app/shared/forms/client-profile-form.factory";
import { TextOnlyDirective } from "@app/core/directives/text-only.directive";
import { ReservedBusinessNameDirective } from "@app/core/directives/reserved-business-name.directive";
import { ClientService } from "@app/core/service/api/client.service";
import { ToastService } from "@app/core/service/state/toast.service";
import { Client, isPartnerRole } from "@app/model/client";
import { ClientRequestDTO } from "@app/model/dto/request/client-request.dto";
import { ErrorComponent } from "@app/shared/components/error/error.component";
import { PrimengModule } from "@app/shared/primeng/primeng.module";
import { AbstractControlUtils } from "@app/shared/utils/abstract-control.utils";

@Component({
  selector: "app-view-edit-profile",
  templateUrl: "./view-edit-profile.component.html",
  styleUrls: ["./view-edit-profile.component.scss"],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PrimengModule,
    ErrorComponent,
    TextOnlyDirective,
    ReservedBusinessNameDirective,
  ],
})
export class ViewEditProfileComponent implements OnInit {
  profileForm: FormGroup;
  isEditMode = false;
  loading = false;
  clientData: Client | null = null;

  socialMediaOptions = [
    { label: "Instagram", value: "instagram" },
    { label: "Facebook", value: "facebook" },
    { label: "LinkedIn", value: "linkedin" },
    { label: "X (Twitter)", value: "x" },
    { label: "TikTok", value: "tiktok" },
  ];

  constructor(
    private readonly fb: FormBuilder,
    private readonly clientService: ClientService,
    private readonly toastService: ToastService,
    private readonly cdr: ChangeDetectorRef
  ) {
    this.createForm();
  }

  createForm(): void {
    this.profileForm = ClientProfileFormFactory.createProfileForm(this.fb, {
      contactFields: "profile",
      includeSocialMedia: true,
    });
  }

  get addressesFormArray(): FormArray {
    return this.profileForm.get("addresses") as FormArray;
  }

  addAddress(): void {
    this.addressesFormArray.push(
      ClientProfileFormFactory.createEmptyAddressGroup(this.fb)
    );
  }

  removeAddress(index: number): void {
    if (this.addressesFormArray.length > 1) {
      this.addressesFormArray.removeAt(index);
    }
  }

  private populateAddresses(addresses: any[]): void {
    const addressesArray = this.addressesFormArray;
    addressesArray.clear();
    if (addresses && addresses.length > 0) {
      addresses.forEach((addr) => {
        addressesArray.push(
          ClientProfileFormFactory.createAddressGroupFromData(this.fb, addr)
        );
      });
    } else {
      this.addAddress();
    }
  }

  get socialMediaArray(): FormArray {
    return this.profileForm.get("socialMedia") as FormArray;
  }

  addSocialMedia(): void {
    this.socialMediaArray.push(
      ClientProfileFormFactory.createSocialMediaGroup(this.fb)
    );
  }

  removeSocialMedia(index: number): void {
    this.socialMediaArray.removeAt(index);
  }

  ngOnInit(): void {
    this.loadUserProfile();

    this.clientService.clientAtual$.subscribe((client) => {
      if (client && !this.loading) {
        this.clientData = { ...client };
        this.populateForm(this.clientData);
        this.cdr.markForCheck();
      }
    });
  }

  loadUserProfile(): void {
    this.loading = true;

    const userId = this.getUserIdFromStorage();

    if (!userId) {
      this.loading = false;
      return;
    }

    this.fetchClientProfile(userId);
  }

  private getUserIdFromStorage(): string | null {
    const userDataStr = localStorage.getItem("telas_token_user");

    if (!userDataStr) {
      this.toastService.erro("User data not found");
      return null;
    }

    try {
      const userData = JSON.parse(userDataStr);
      const userId = userData.id;

      if (!userId) {
        this.toastService.erro("User ID not found");
        return null;
      }

      return userId;
    } catch (error) {
      this.toastService.erro("Error loading profile data");
      return null;
    }
  }

  private fetchClientProfile(userId: string): void {
    this.clientService.buscarClient<Client>(userId).subscribe({
      next: (client) => {
        this.clientData = client;
        this.populateForm(client);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toastService.erro("Could not load profile data");
      },
    });
  }

  populateForm(client: Client): void {
    if (!client) {
      return;
    }
    const formData = this.buildFormData(client);
    this.profileForm.patchValue(formData, { emitEvent: false });
    this.populateAddresses(client.addresses || []);
    this.clearSocialMediaArray();
    this.populateSocialMedia(client.socialMedia);
    this.disableForm();
  }

  private buildFormData(client: Client): any {
    const phoneNumber = client.contact?.phone || "";
    const address = this.getFirstAddress(client);

    return {
      businessName: client.businessName || "",
      industry: client.industry || "",
      websiteUrl: client.websiteUrl || "",
      email: client.contact?.email || "",
      phone: phoneNumber,
      ...address,
    };
  }

  private getFirstAddress(client: Client): any {
    const address = client.addresses?.[0];

    return {
      id: address?.id ?? null,
      street: address?.street || "",
      zipCode: address?.zipCode || "",
      city: address?.city || "",
      state: address?.state || "",
      country: address?.country || "",
      address2: address?.address2 || "",
    };
  }

  private clearSocialMediaArray(): void {
    while (this.socialMediaArray.length !== 0) {
      this.socialMediaArray.removeAt(0);
    }
  }

  private populateSocialMedia(socialMedia: any): void {
    if (!socialMedia) {
      return;
    }

    const socialPlatforms = [
      { key: "instagramUrl", platform: "instagram" },
      { key: "facebookUrl", platform: "facebook" },
      { key: "linkedinUrl", platform: "linkedin" },
      { key: "xUrl", platform: "x" },
      { key: "tiktokUrl", platform: "tiktok" },
    ];

    socialPlatforms.forEach(({ key, platform }) => {
      if (socialMedia[key]) {
        this.addSocialMediaWithValues(platform, socialMedia[key]);
      }
    });
  }

  addSocialMediaWithValues(platform: string, url: string): void {
    this.socialMediaArray.push(
      ClientProfileFormFactory.createSocialMediaGroup(this.fb, platform, url),
      { emitEvent: false }
    );
  }

  disableForm(): void {
    Object.keys(this.profileForm.controls).forEach((key) => {
      if (key !== "socialMedia") {
        this.profileForm.get(key)?.disable();
      } else {
        const socialMediaControls = this.socialMediaArray.controls;
        socialMediaControls.forEach((control) => {
          control.disable();
        });
      }
    });
  }

  enableForm(): void {
    Object.keys(this.profileForm.controls).forEach((key) => {
      if (key !== "socialMedia" && key !== "email") {
        this.profileForm.get(key)?.enable();
      } else if (key === "socialMedia") {
        const socialMediaControls = this.socialMediaArray.controls;
        socialMediaControls.forEach((control) => {
          control.enable();
        });
      }
    });

    if (!this.isPartnerProfile()) {
      this.profileForm.get("email")?.enable();
    }
  }

  isPartnerProfile(): boolean {
    return isPartnerRole(this.clientData?.role);
  }

  toggleEditMode(): void {
    this.isEditMode = !this.isEditMode;

    if (this.isEditMode) {
      this.enableForm();
    } else {
      this.disableForm();
      this.populateForm(this.clientData);
    }
  }

  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    const formValues = this.profileForm.getRawValue();
    const clientRequest = this.buildClientRequest(formValues);
    this.updateClient(clientRequest);
  }

  private buildClientRequest(formValues: any): ClientRequestDTO {
    const socialMedia = this.buildSocialMediaObject(formValues.socialMedia);

    const clientRequest: ClientRequestDTO = {
      businessName: formValues.businessName,
      industry: formValues.industry,
      websiteUrl: formValues.websiteUrl || "",
      status: this.clientData?.status,
      socialMedia: Object.keys(socialMedia).length > 0 ? socialMedia : null,
      contact: {
        email: this.isPartnerProfile()
          ? this.clientData?.contact?.email ?? formValues.email
          : formValues.email,
        phone: formValues.phone,
      },
      addresses: formValues.addresses.map((addr: any) => {
        const addressPayload: any = {
          street: addr.street,
          zipCode: addr.zipCode,
          city: addr.city,
          state: addr.state,
          country: addr.country,
          address2: addr.address2 || "",
        };
        if (addr.id) {
          addressPayload.id = addr.id;
        }
        return addressPayload;
      }),
    };

    return clientRequest;
  }

  private buildSocialMediaObject(
    socialMediaArray: any[]
  ): Record<string, string> {
    const socialMedia: Record<string, string> = {};

    if (
      socialMediaArray &&
      Array.isArray(socialMediaArray) &&
      socialMediaArray.length > 0
    ) {
      socialMediaArray.forEach((item: { platform: string; url: string }) => {
        if (item.platform && item.url) {
          socialMedia[`${item.platform}Url`] = item.url;
        }
      });
    }

    return socialMedia;
  }

  private updateClient(clientRequest: ClientRequestDTO): void {
    if (!this.clientData?.id) {
      this.loading = false;
      return;
    }

    this.clientService.editar(this.clientData.id, clientRequest).subscribe({
      next: () => {
        this.toastService.sucesso("Profile updated successfully");
        this.reloadUpdatedProfile();
      },
      error: () => {
        this.toastService.erro("Error updating profile");
        this.loading = false;
      },
    });
  }

  private reloadUpdatedProfile(): void {
    this.clientService.buscarClient<Client>(this.clientData.id).subscribe({
      next: (updatedClient) => {
        this.handleUpdatedClient(updatedClient);
      },
      error: () => {
        this.toastService.erro("Error loading updated profile data");
        this.loading = false;
      },
    });
  }

  private handleUpdatedClient(updatedClient: Client): void {
    this.clientService.setClientAtual(updatedClient);
    localStorage.setItem("telas_token_user", JSON.stringify(updatedClient));

    this.clientData = updatedClient;
    this.isEditMode = false;
    this.disableForm();
    this.populateForm(updatedClient);
    this.loading = false;
  }

  cancelEdit(): void {
    this.isEditMode = false;
    this.disableForm();
    this.populateForm(this.clientData);
  }

  mostrarErro(campo: string): boolean {
    return AbstractControlUtils.verificarCampoInvalidoTocado(
      this.profileForm,
      campo
    );
  }

  campoObrigatorio(campo: string): boolean {
    return AbstractControlUtils.verificarCampoRequired(this.profileForm, campo);
  }
}
