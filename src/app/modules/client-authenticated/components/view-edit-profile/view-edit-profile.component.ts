import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
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
    private readonly toastService: ToastService
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
      phone: ['', Validators.required],
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
  }

  loadUserProfile(): void {
    this.loading = true;
    
    // Obter dados do localStorage
    const userDataStr = localStorage.getItem('telas_token_user');
    
    if (userDataStr) {
      try {
        // Deserializar os dados do localStorage
        this.clientData = JSON.parse(userDataStr);
        console.log('Data loaded from localStorage:', this.clientData);
        this.populateForm(this.clientData);
        this.loading = false;
      } catch (error) {
        console.error('Error processing user data:', error);
        this.loading = false;
        this.toastService.erro('Error loading profile data');
      }
    } else {
      // Se não encontrar dados no localStorage, buscar pelo ID
      const userId = localStorage.getItem('telas_token_user') ? 
        JSON.parse(localStorage.getItem('telas_token_user')).id : null;
      
      if (userId) {
        this.clientService.buscarClient<Client>(userId).subscribe({
          next: (client) => {
            this.clientData = client;
            this.populateForm(client);
            this.loading = false;
          },
          error: (error) => {
            console.error('Error fetching client data:', error);
            this.loading = false;
            this.toastService.erro('Could not load profile data');
          }
        });
      } else {
        this.loading = false;
        this.toastService.erro('User ID not found');
      }
    }
  }

  populateForm(client: Client): void {
    if (!client) {
      console.error('No client data provided');
      return;
    }

    console.log('Populating form with data:', client);

    // Mapear dados do cliente para o formulário
    const formData = {
      businessName: client.businessName || '',
      identificationNumber: client.identificationNumber || '',
      industry: client.industry || '',
      websiteUrl: client.websiteUrl || '',
      
      // Contact info
      email: client.contact?.email || '',
      phone: client.contact?.phone || '',
      
      // Owner info
      ownerFirstName: client.owner?.firstName || '',
      ownerLastName: client.owner?.lastName || '',
      ownerEmail: client.owner?.email || '',
      ownerPhone: client.owner?.phone || '',
      
      // Address (primeiro endereço, se existir)
      street: client.addresses && client.addresses.length > 0 ? client.addresses[0].street || '' : '',
      zipCode: client.addresses && client.addresses.length > 0 ? client.addresses[0].zipCode || '' : '',
      city: client.addresses && client.addresses.length > 0 ? client.addresses[0].city || '' : '',
      state: client.addresses && client.addresses.length > 0 ? client.addresses[0].state || '' : '',
      country: client.addresses && client.addresses.length > 0 ? client.addresses[0].country || '' : '',
      complement: client.addresses && client.addresses.length > 0 ? client.addresses[0].complement || '' : '',
    };

    // Atualizar o formulário com os dados
    this.profileForm.patchValue(formData);
    
    // Limpar array de redes sociais
    while (this.socialMediaArray.length !== 0) {
      this.socialMediaArray.removeAt(0);
    }
    
    // Adicionar redes sociais existentes
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
    this.socialMediaArray.push(
      this.fb.group({
        platform: [platform, Validators.required], 
        url: [url, [
          Validators.required,
          Validators.maxLength(200), 
          Validators.pattern(/^(https?:\/\/)[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+(:\d+)?(\/\S*)?$/)
        ]],
      })
    );
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
    // Não permitir edição do número de identificação
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
    if (this.profileForm.invalid) {
      this.toastService.aviso('Please correct the errors in the form before saving');
      return;
    }
    
    this.loading = true;
    
    const formValues = this.profileForm.getRawValue();
    
    // Converter o array de socialMedia para o formato esperado pela API
    const socialMedia: Record<string, string> = {};
    if (formValues.socialMedia && Array.isArray(formValues.socialMedia) && formValues.socialMedia.length > 0) {
      formValues.socialMedia.forEach((item: { platform: string; url: string }) => {
        if (item.platform && item.url) {
          socialMedia[`${item.platform}Url`] = item.url;
        }
      });
    }
    
    const clientRequest: ClientRequestDTO = {
      businessName: formValues.businessName,
      identificationNumber: this.clientData?.identificationNumber,
      industry: formValues.industry,
      websiteUrl: formValues.websiteUrl,
      
      contact: {
        email: formValues.email,
        phone: formValues.phone
      },
      
      owner: {
        identificationNumber: this.clientData?.identificationNumber,
        firstName: formValues.ownerFirstName,
        lastName: formValues.ownerLastName,
        email: formValues.ownerEmail,
        phone: formValues.ownerPhone
      },
      
      addresses: [
        {
          street: formValues.street,
          zipCode: formValues.zipCode,
          city: formValues.city,
          state: formValues.state,
          country: formValues.country,
          complement: formValues.complement,
          partnerAddress: false
        }
      ],
      
      socialMedia: Object.keys(socialMedia).length > 0 ? socialMedia : undefined
    };
    
    console.log('Data to be sent:', clientRequest);
    
    if (this.clientData?.id) {
      this.clientService.editar(this.clientData.id, clientRequest).subscribe({
        next: (response) => {
          console.log('Profile updated successfully:', response);
          this.toastService.sucesso('Profile updated successfully');
          this.isEditMode = false;
          this.disableForm();
          
          // Atualizar os dados do localStorage após a edição bem-sucedida
          this.loadUserProfile();
        },
        error: (error) => {
          console.error('Error updating profile:', error);
          this.toastService.erro('Error updating profile');
          this.loading = false;
        },
        complete: () => {
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
