import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { Client } from '@app/model/client';
import { ClientService } from '@app/core/service/api/client.service';
import { ClientRequestDTO } from '@app/model/dto/request/client-request.dto';
import { ToastService } from '@app/core/service/state/toast.service';
import { PrimengModule } from '@app/shared/primeng/primeng.module';

@Component({
  selector: 'app-view-edit-profile',
  templateUrl: './view-edit-profile.component.html',
  styleUrls: ['./view-edit-profile.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PrimengModule]
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
    
    const userDataStr = localStorage.getItem('telas_token_user');
    
    if (userDataStr) {
      try {
        const userData = JSON.parse(userDataStr);
        const userId = userData.id;
        
        if (userId) {
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
        } else {
          this.loading = false;
          this.toastService.erro('User ID not found');
        }
      } catch (error) {
        this.loading = false;
        this.toastService.erro('Error loading profile data');
      }
    } else {
      this.loading = false;
      this.toastService.erro('User data not found');
    }
  }

  populateForm(client: Client): void {
    if (!client) {
      return;
    }

    let phoneNumber = client.contact?.phone || '';
    if (phoneNumber && !phoneNumber.includes('+')) {
      if (phoneNumber.length >= 10) {
        phoneNumber = `+1 ${phoneNumber.substring(0, 3)} ${phoneNumber.substring(3, 6)} ${phoneNumber.substring(6)}`;
      }
    }

    const formData = {
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
      
      street: client.addresses && client.addresses.length > 0 ? client.addresses[0].street || '' : '',
      zipCode: client.addresses && client.addresses.length > 0 ? client.addresses[0].zipCode || '' : '',
      city: client.addresses && client.addresses.length > 0 ? client.addresses[0].city || '' : '',
      state: client.addresses && client.addresses.length > 0 ? client.addresses[0].state || '' : '',
      country: client.addresses && client.addresses.length > 0 ? client.addresses[0].country || '' : '',
      complement: client.addresses && client.addresses.length > 0 ? client.addresses[0].complement || '' : '',
    };

    this.profileForm.patchValue(formData, { emitEvent: false });
    
    while (this.socialMediaArray.length !== 0) {
      this.socialMediaArray.removeAt(0);
    }
    
    if (client.socialMedia) {
      const socialMedia = client.socialMedia;
      
      if (socialMedia.instagramUrl) {
        this.addSocialMediaWithValues('instagram', socialMedia.instagramUrl);
      }
      
      if (socialMedia.facebookUrl) {
        this.addSocialMediaWithValues('facebook', socialMedia.facebookUrl);
      }
      
      if (socialMedia.linkedinUrl) {
        this.addSocialMediaWithValues('linkedin', socialMedia.linkedinUrl);
      }
      
      if (socialMedia.xUrl) {
        this.addSocialMediaWithValues('x', socialMedia.xUrl);
      }
      
      if (socialMedia.tiktokUrl) {
        this.addSocialMediaWithValues('tiktok', socialMedia.tiktokUrl);
      }
    }
    
    this.disableForm();
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
    
    let normalizedPhone = formValues.phone?.replace(/\D/g, '') || '';
    
    if (normalizedPhone.length > 11) {
      normalizedPhone = normalizedPhone.slice(-11);
    }
    
    if (normalizedPhone.length < 10) {
      this.toastService.erro('Phone number must be between 10 and 11 digits');
      this.loading = false;
      return;
    }
    
    const socialMedia: Record<string, string> = {};
    if (formValues.socialMedia && Array.isArray(formValues.socialMedia) && formValues.socialMedia.length > 0) {
      formValues.socialMedia.forEach((item: { platform: string; url: string }) => {
        if (item.platform && item.url) {
          socialMedia[`${item.platform}Url`] = item.url;
        }
      });
    }
    
    const addressId = this.clientData?.addresses && this.clientData.addresses.length > 0
      ? this.clientData.addresses[0].id
      : undefined;

    const clientRequest: ClientRequestDTO = {
      businessName: formValues.businessName,
      identificationNumber: this.clientData?.identificationNumber || '',
      industry: formValues.industry,
      websiteUrl: formValues.websiteUrl || '',
      status: this.clientData?.status,
      
      contact: {
        email: formValues.email,
        phone: normalizedPhone
      },
      
      owner: {
        identificationNumber: this.clientData?.identificationNumber || '',
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
    
    if (this.clientData?.id) {
      this.clientService.editar(this.clientData.id, clientRequest).subscribe({
        next: () => {
          this.toastService.sucesso('Profile updated successfully');
          
          this.clientService.buscarClient<Client>(this.clientData.id).subscribe({
            next: (updatedClient) => {
              this.clientService.setClientAtual(updatedClient);
              
              localStorage.setItem('telas_token_user', JSON.stringify(updatedClient));
              
              this.clientData = updatedClient;
              
              this.isEditMode = false;
              this.disableForm();
              this.populateForm(updatedClient);
              
              this.loading = false;
            },
            error: () => {
              this.toastService.erro('Error loading updated profile data');
              this.loading = false;
            }
          });
        },
        error: () => {
          this.toastService.erro('Error updating profile');
          this.loading = false;
        }
      });
    }
  }

  cancelEdit(): void {
    this.isEditMode = false;
    this.disableForm();
    this.populateForm(this.clientData);
  }
}