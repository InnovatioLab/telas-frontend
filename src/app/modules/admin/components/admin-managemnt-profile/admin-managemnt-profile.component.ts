import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PrimengModule } from '@app/shared/primeng/primeng.module';
import { IconsModule } from '@app/shared/icons/icons.module';
import { Authentication } from '@app/core/service/auth/autenthication';
import { ToastService } from '@app/core/service/state/toast.service';
import { AuthenticationStorage } from '@app/core/service/auth/authentication-storage';
import { MessageModule } from 'primeng/message';
import { AlterarSenhaComponent } from '@app/shared/components/alterar-senha/alterar-senha.component';

interface SecurityQuestion {
  text: string;
  value: string;
}

interface MenuItem {
  id: number;
  icon: string;
  label: string;
}

interface AdminUserData {
  id: string;
  businessName: string;
  identificationNumber: string;
  role: string;
  industry: string;
  status: string;
  contact: {
    id: string;
    email: string;
    phone: string;
  };
  owner: {
    id: string;
    identificationNumber: string;
    firstName: string;
    lastName: string | null;
    email: string;
    phone: string;
  };
  socialMedia: any;
  addresses: Array<{
    id: string;
    street: string;
    zipCode: string;
    city: string;
    state: string;
    country: string;
    complement: string | null;
    latitude: string | null;
    longitude: string | null;
    partnerAddress: boolean;
    coordinatesParams: string;
  }>;
  attachments: any[];
  ads: any[];
  notifications: any[];
  termAccepted: boolean;
  cartId: string | null;
  currentSubscriptionFlowStep: number;
}

@Component({
  selector: 'app-admin-managemnt-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PrimengModule,
    IconsModule,
    MessageModule,
    AlterarSenhaComponent
  ],
  templateUrl: './admin-managemnt-profile.component.html',
  styleUrls: ['./admin-managemnt-profile.component.scss']
})
export class AdminManagementProfileComponent implements OnInit {
  profileForm: FormGroup;
  securityQuestionsForm: FormGroup;
  businessForm: FormGroup;
  addressForm: FormGroup;
  loadingProfile = false;
  loadingSecurityQuestions = false;
  loadingBusiness = false;
  loadingAddress = false;
  adminUser: AdminUserData | null = null;
  activeTabIndex = 0;
  
  securityQuestions: SecurityQuestion[] = [
    { text: 'What was the name of your first pet?', value: 'pet_name' },
    { text: 'What city were you born in?', value: 'birth_city' },
    { text: 'What was the name of your first school?', value: 'first_school' },
    { text: 'What is your mother\'s maiden name?', value: 'mother_maiden_name' },
    { text: 'What was your first car model?', value: 'first_car' },
    { text: 'What was your favorite childhood movie?', value: 'childhood_movie' }
  ];

  menuItems: MenuItem[] = [
    { id: 0, icon: 'pi pi-user', label: 'Personal Profile' },
    { id: 1, icon: 'pi pi-building', label: 'Company Data' },
    { id: 2, icon: 'pi pi-map-marker', label: 'Address' },
    { id: 3, icon: 'pi pi-key', label: 'Change Password' }
  ];
  
  constructor(
    private readonly fb: FormBuilder,
    private readonly auth: Authentication,
    private readonly toastService: ToastService
  ) { }

  ngOnInit(): void {
    this.loadUserData();
    this.initForms();
  }

  private loadUserData(): void {
    this.loadingProfile = true;
    try {
      const userData = AuthenticationStorage.getDataUser();
      if (userData) {
        this.adminUser = JSON.parse(userData) as AdminUserData;
        console.log('Dados do administrador carregados:', this.adminUser);
      } else {
        this.adminUser = this.auth._clientSignal() as AdminUserData;
        console.log('Dados do administrador obtidos do clientSignal:', this.adminUser);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do administrador:', error);
      this.toastService.erro('Não foi possível carregar seus dados. Por favor, tente novamente mais tarde.');
    } finally {
      this.loadingProfile = false;
    }
  }

  private initForms(): void {
    // Formulário de perfil pessoal
    this.profileForm = this.fb.group({
      firstName: [this.adminUser?.owner?.firstName || '', [Validators.required, Validators.minLength(3)]],
      lastName: [this.adminUser?.owner?.lastName || '', Validators.minLength(2)],
      email: [this.adminUser?.owner?.email || '', [Validators.required, Validators.email]],
      phone: [this.adminUser?.owner?.phone || '', Validators.pattern(/^[0-9\-\+\(\)\ ]+$/)]
    });

    // Formulário de empresa/negócio
    this.businessForm = this.fb.group({
      businessName: [this.adminUser?.businessName || '', [Validators.required, Validators.minLength(2)]],
      identificationNumber: [this.adminUser?.identificationNumber || '', Validators.required],
      industry: [this.adminUser?.industry || '', Validators.required]
    });

    // Formulário de endereço
    const primaryAddress = this.adminUser?.addresses?.[0] || null;
    this.addressForm = this.fb.group({
      street: [primaryAddress?.street || '', Validators.required],
      zipCode: [primaryAddress?.zipCode || '', Validators.required],
      city: [primaryAddress?.city || '', Validators.required],
      state: [primaryAddress?.state || '', Validators.required],
      country: [primaryAddress?.country || 'US', Validators.required],
      complement: [primaryAddress?.complement || '']
    });
    
    // Formulário de perguntas de segurança
    this.securityQuestionsForm = this.fb.group({
      question1: ['', Validators.required],
      answer1: ['', Validators.required],
      question2: ['', Validators.required],
      answer2: ['', Validators.required]
    }, { validator: this.differentQuestionsValidator });
  }
  
  private differentQuestionsValidator(group: FormGroup): { [key: string]: any } | null {
    const question1 = group.get('question1')?.value;
    const question2 = group.get('question2')?.value;
    
    if (!question1 || !question2) {
      return null;
    }
    
    return question1 !== question2 ? null : { 'sameQuestions': true };
  }

  updateProfile(): void {
    if (this.profileForm.invalid) {
      this.toastService.erro('Please correct the errors in the form.');
      return;
    }

    this.loadingProfile = true;

    setTimeout(() => {
      this.loadingProfile = false;
      this.toastService.sucesso('Profile updated successfully!');
    }, 1000);
  }

  updateBusiness(): void {
    if (this.businessForm.invalid) {
      this.toastService.erro('Please correct the errors in the company form.');
      return;
    }

    this.loadingBusiness = true;
    const businessData = this.businessForm.value;
    
    setTimeout(() => {
      this.loadingBusiness = false;
      this.toastService.sucesso('Company information updated successfully!');
    }, 1000);
  }

  updateAddress(): void {
    if (this.addressForm.invalid) {
      this.toastService.erro('Please correct the errors in the address form.');
      return;
    }

    this.loadingAddress = true;
    const addressData = this.addressForm.value;

    
    setTimeout(() => {
      this.loadingAddress = false;
      this.toastService.sucesso('Address updated successfully!');
    }, 1000);
  }
  
  saveSecurityQuestions(): void {
    if (this.securityQuestionsForm.invalid) {
      this.toastService.erro('Please correct the errors in the security questions form.');
      return;
    }
    
    if (this.securityQuestionsForm.hasError('sameQuestions')) {
      this.toastService.erro('Please select different questions.');
      return;
    }

    this.loadingSecurityQuestions = true;
    const securityData = this.securityQuestionsForm.value;

    console.log('Security questions to be saved:', securityData);
    
    setTimeout(() => {
      this.loadingSecurityQuestions = false;
      this.toastService.sucesso('Security questions saved successfully!');
    }, 1000);
  }

  hasError(formGroup: FormGroup, controlName: string, errorType: string): boolean {
    const control = formGroup.get(controlName);
    return control?.touched && control?.hasError(errorType) || false;
  }
  
  setActiveTab(index: number): void {
    this.activeTabIndex = index;
  }

  get fullName(): string {
    const firstName = this.adminUser?.owner?.firstName || '';
    const lastName = this.adminUser?.owner?.lastName || '';
    return `${firstName} ${lastName}`.trim();
  }

  get userEmail(): string {
    return this.adminUser?.owner?.email || this.adminUser?.contact?.email || '';
  }

  get hasAddress(): boolean {
    return this.adminUser?.addresses && this.adminUser.addresses.length > 0;
  }

  get formattedAddress(): string {
    if (!this.hasAddress) return '';
    
    const addr = this.adminUser?.addresses[0];
    return `${addr.street}, ${addr.city}, ${addr.state} ${addr.zipCode}, ${addr.country}`;
  }
}