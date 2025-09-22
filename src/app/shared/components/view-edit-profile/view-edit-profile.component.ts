import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ClientService } from '@app/core/service/api/client.service';
import { ToastService } from '@app/core/service/state/toast.service';
import { Client } from '@app/model/client';
import { ClientRequestDTO } from '@app/model/dto/request/client-request.dto';
import { ErrorComponent } from '@app/shared/components/error/error.component';
import { IconsModule } from '@app/shared/icons/icons.module';
import { IconPlusComponent } from '@app/shared/icons/plus.icon';
import { PrimengModule } from '@app/shared/primeng/primeng.module';

@Component({
  selector: 'app-view-edit-profile',
  templateUrl: './view-edit-profile.component.html',
  styleUrls: ['./view-edit-profile.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PrimengModule, ErrorComponent, IconPlusComponent, IconsModule]
})
export class ViewEditProfileComponent implements OnInit {
  profileForm: FormGroup;
  isEditMode = false;
  loading = false;
  clientData: Client | null = null;

  socialMediaOptions = [
    { label: 'Instagram', value: 'instagram' },
    { label: 'Facebook', value: 'facebook' },
    { label: 'LinkedIn', value: 'linkedin' },
    { label: 'X (Twitter)', value: 'x' },
    { label: 'TikTok', value: 'tiktok' },
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
    this.profileForm = this.fb.group({
      businessName: ['', Validators.required],
      identificationNumber: ['', Validators.required],
      industry: ['', Validators.required],
      websiteUrl: [''],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, this.phoneNumberValidator]],
      ownerFirstName: ['', Validators.required],
      ownerLastName: [''],
      ownerEmail: ['', [Validators.required, Validators.email]],
      ownerPhone: ['', Validators.required],
      street: ['', Validators.required],
      zipCode: ['', Validators.required],
      city: ['', Validators.required],
      state: ['', Validators.required],
      country: ['', Validators.required],
      complement: [''],
      socialMedia: this.fb.array([])
    });
  }

  phoneNumberValidator(control: AbstractControl) {
    const value = control.value ? String(control.value).replace(/\D/g, '') : '';
    if (!value) {
      return { required: true };
    }
    if (value.length !== 10 && value.length !== 11) {
      return { pattern: true };
    }
    return null;
  }

  get socialMediaArray(): FormArray {
    return this.profileForm.get('socialMedia') as FormArray;
  }

  addSocialMedia(): void {
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
    const userDataStr = localStorage.getItem('telas_token_user');
    
    if (!userDataStr) {
      this.toastService.erro('User data not found');
      return null;
    }
    
    try {
      const userData = JSON.parse(userDataStr);
      const userId = userData.id;
      
      if (!userId) {
        this.toastService.erro('User ID not found');
        return null;
      }
      
      return userId;
    } catch (error) {
      this.toastService.erro('Error loading profile data');
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
        this.toastService.erro('Could not load profile data');
      }
    });
  }

  populateForm(client: Client): void {
    if (!client) {
      return;
    }

    const formData = this.buildFormData(client);
    this.profileForm.patchValue(formData, { emitEvent: false });
    
    this.clearSocialMediaArray();
    this.populateSocialMedia(client.socialMedia);
    this.disableForm();
  }

  private buildFormData(client: Client): any {
    const phoneNumber = this.formatPhoneNumber(client.contact?.phone || '');
    const address = this.getFirstAddress(client);

    return {
      businessName: client.businessName || '',
      identificationNumber: client.identificationNumber || '',
      industry: client.industry || '',
      websiteUrl: client.websiteUrl || '',
      email: client.contact?.email || '',
      phone: phoneNumber,
      ownerFirstName: client.owner?.firstName || '',
      ownerLastName: client.owner?.lastName || '',
      ownerEmail: client.owner?.email || '',
      ownerPhone: client.owner?.phone || '',
      ...address
    };
  }

  private formatPhoneNumber(phoneNumber: string): string {
    if (!phoneNumber || phoneNumber.includes('+')) {
      return phoneNumber;
    }
    
    if (phoneNumber.length >= 10) {
      return `+1 ${phoneNumber.substring(0, 3)} ${phoneNumber.substring(3, 6)} ${phoneNumber.substring(6)}`;
    }
    
    return phoneNumber;
  }

  private getFirstAddress(client: Client): any {
    const address = client.addresses?.[0];
    
    return {
      street: address?.street || '',
      zipCode: address?.zipCode || '',
      city: address?.city || '',
      state: address?.state || '',
      country: address?.country || '',
      complement: address?.complement || ''
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
      { key: 'instagramUrl', platform: 'instagram' },
      { key: 'facebookUrl', platform: 'facebook' },
      { key: 'linkedinUrl', platform: 'linkedin' },
      { key: 'xUrl', platform: 'x' },
      { key: 'tiktokUrl', platform: 'tiktok' }
    ];

    socialPlatforms.forEach(({ key, platform }) => {
      if (socialMedia[key]) {
        this.addSocialMediaWithValues(platform, socialMedia[key]);
      }
    });
  }

  addSocialMediaWithValues(platform: string, url: string): void {
    const socialMediaGroup = this.fb.group({
      platform: [platform, Validators.required], 
      url: [url, [
        Validators.required,
        Validators.maxLength(200), 
        Validators.pattern(/^(https?:\/\/)[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+(:\d+)?(\/\S*)?$/)
      ]],
    });
    
    this.socialMediaArray.push(socialMediaGroup, { emitEvent: false });
  }

  disableForm(): void {
    Object.keys(this.profileForm.controls).forEach(key => {
      if (key !== 'socialMedia') {
        this.profileForm.get(key)?.disable();
      } else {
        const socialMediaControls = this.socialMediaArray.controls;
        socialMediaControls.forEach(control => {
          control.disable();
        });
      }
    });
  }

  enableForm(): void {
    Object.keys(this.profileForm.controls).forEach(key => {
      if (key !== 'socialMedia') {
        this.profileForm.get(key)?.enable();
      } else {
        const socialMediaControls = this.socialMediaArray.controls;
        socialMediaControls.forEach(control => {
          control.enable();
        });
      }
    });
    this.profileForm.get('identificationNumber')?.disable();
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
    this.loading = true;
    
    const formValues = this.profileForm.getRawValue();
    const normalizedPhone = this.validateAndNormalizePhone(formValues.phone);
    
    if (!normalizedPhone) {
      this.loading = false;
      return;
    }
    
    const clientRequest = this.buildClientRequest(formValues, normalizedPhone);
    this.updateClient(clientRequest);
  }

  private validateAndNormalizePhone(phone: string): string | null {
    let normalizedPhone = phone?.replace(/\D/g, '') || '';
    
    if (normalizedPhone.length > 11) {
      normalizedPhone = normalizedPhone.slice(-11);
    }
    
    if (normalizedPhone.length < 10) {
      this.toastService.erro('Phone number must be between 10 and 11 digits');
      return null;
    }
    
    return normalizedPhone;
  }

  private buildClientRequest(formValues: any, normalizedPhone: string): ClientRequestDTO {
    const socialMedia = this.buildSocialMediaObject(formValues.socialMedia);
    const addressId = this.getExistingAddressId();

    const clientRequest: ClientRequestDTO = {
      businessName: formValues.businessName,
      identificationNumber: formValues.identificationNumber,
      industry: formValues.industry,
      websiteUrl: formValues.websiteUrl || '',
      status: this.clientData?.status,
      
      contact: {
        email: formValues.email,
        phone: normalizedPhone
      },
      
      owner: {
        identificationNumber: formValues.identificationNumber,
        firstName: formValues.ownerFirstName,
        lastName: formValues.ownerLastName || '',
        email: formValues.ownerEmail || formValues.email,
        phone: normalizedPhone
      },
      
      addresses: [
        {
          id: addressId,
          street: formValues.street,
          zipCode: formValues.zipCode,
          city: formValues.city,
          state: formValues.state,
          country: formValues.country,
          complement: formValues.complement || ''
        }
      ]
    };

    if (Object.keys(socialMedia).length > 0) {
      clientRequest.socialMedia = socialMedia;
    }

    return clientRequest;
  }

  private buildSocialMediaObject(socialMediaArray: any[]): Record<string, string> {
    const socialMedia: Record<string, string> = {};
    
    if (socialMediaArray && Array.isArray(socialMediaArray) && socialMediaArray.length > 0) {
      socialMediaArray.forEach((item: { platform: string; url: string }) => {
        if (item.platform && item.url) {
          socialMedia[`${item.platform}Url`] = item.url;
        }
      });
    }
    
    return socialMedia;
  }

  private getExistingAddressId(): string | undefined {
    return this.clientData?.addresses && this.clientData.addresses.length > 0
      ? this.clientData.addresses[0].id
      : undefined;
  }

  private updateClient(clientRequest: ClientRequestDTO): void {
    if (!this.clientData?.id) {
      this.loading = false;
      return;
    }

    this.clientService.editar(this.clientData.id, clientRequest).subscribe({
      next: () => {
        this.toastService.sucesso('Profile updated successfully');
        this.reloadUpdatedProfile();
      },
      error: () => {
        this.toastService.erro('Error updating profile');
        this.loading = false;
      }
    });
  }

  private reloadUpdatedProfile(): void {
    this.clientService.buscarClient<Client>(this.clientData.id).subscribe({
      next: (updatedClient) => {
        this.handleUpdatedClient(updatedClient);
      },
      error: () => {
        this.toastService.erro('Error loading updated profile data');
        this.loading = false;
      }
    });
  }

  private handleUpdatedClient(updatedClient: Client): void {
    this.clientService.setClientAtual(updatedClient);
    localStorage.setItem('telas_token_user', JSON.stringify(updatedClient));
    
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
}