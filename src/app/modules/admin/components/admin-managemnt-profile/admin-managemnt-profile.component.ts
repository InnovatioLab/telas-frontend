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
  component: string;
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
    { id: 0, icon: '', component: 'app-icon-user', label: 'Personal Profile' },
    { id: 1, icon: '', component: 'app-icon-key', label: 'Change Password' }
  ];
  
  constructor(
    private readonly fb: FormBuilder,
    private readonly auth: Authentication,
    private readonly toastService: ToastService
  ) { }

  ngOnInit(): void {
    this.loadUserData();
  }

  private loadUserData(): void {
    this.loadingProfile = true;
    try {
      const userData = AuthenticationStorage.getDataUser();
      if (userData) {
        this.adminUser = JSON.parse(userData) as AdminUserData;
      } else {
        this.adminUser = this.auth._clientSignal() as AdminUserData;
      }
    } catch (error) {
      this.toastService.erro('Não foi possível carregar seus dados. Por favor, tente novamente mais tarde.');
    } finally {
      this.loadingProfile = false;
    }
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

  get primaryAddress() {
    return this.adminUser?.addresses?.[0] || null;
  }

  get formattedPhone(): string {
    const phone = this.adminUser?.owner?.phone;
    if (!phone) return 'Not available';
    
    // Formatar o telefone para exibição
    const digits = phone.replace(/\D/g, '');
    
    if (digits.length < 10) return phone; // Retorna o original se não tiver formato padrão
    
    const countryCode = '+1';
    const areaCode = digits.substring(0, 3);
    const middle = digits.substring(3, 6);
    const last = digits.substring(6, 10);
    
    return `${countryCode} ${areaCode} ${middle} ${last}`;
  }
}