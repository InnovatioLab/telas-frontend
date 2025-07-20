import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { CardModule } from 'primeng/card';
import { Client, DefaultStatus, Address } from '@app/model/client';
import { ClientRequestDTO, AddressRequestDTO } from '@app/model/dto/request/client-request.dto';
import { ClientService } from '@app/core/service/api/client.service';
import { ToastService } from '@app/core/service/state/toast.service';
import { ZipCodeService } from '@app/core/service/api/zipcode.service';
import { IconCloseComponent } from '@app/shared/icons/close.icon';
import { IconCheckComponent } from '@app/shared/icons/check.icon';
import { IconUploadComponent } from '@app/shared/icons/upload.icon';

@Component({
  selector: 'app-edit-client-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    DropdownModule,
    CardModule,
    IconCloseComponent,
    IconCheckComponent,
    IconUploadComponent
  ],
  template: `
    <div class="edit-client-modal">
      <form [formGroup]="editForm" (ngSubmit)="onSubmit()">
        <div class="form-content">
          <div class="form-section">
            <h4>Business Information</h4>
            <div class="form-row">
              <div class="form-field">
                <label for="businessName" class="required">Business Name *</label>
                <input 
                  id="businessName"
                  type="text" 
                  pInputText 
                  formControlName="businessName"
                  placeholder="Enter business name"
                  [class.ng-invalid]="editForm.get('businessName')?.invalid && editForm.get('businessName')?.touched" />
                <small class="error-message" *ngIf="editForm.get('businessName')?.invalid && editForm.get('businessName')?.touched">
                  Business name is required
                </small>
              </div>
              <div class="form-field">
                <label for="identificationNumber" class="required">Identification Number *</label>
                <input 
                  id="identificationNumber"
                  type="text" 
                  pInputText 
                  formControlName="identificationNumber"
                  placeholder="Enter identification number"
                  [class.ng-invalid]="editForm.get('identificationNumber')?.invalid && editForm.get('identificationNumber')?.touched" />
                <small class="error-message" *ngIf="editForm.get('identificationNumber')?.invalid && editForm.get('identificationNumber')?.touched">
                  Identification number is required
                </small>
              </div>
            </div>
            <div class="form-row">
              <div class="form-field">
                <label for="industry" class="required">Industry *</label>
                <input 
                  id="industry"
                  type="text" 
                  pInputText 
                  formControlName="industry"
                  placeholder="Enter industry"
                  [class.ng-invalid]="editForm.get('industry')?.invalid && editForm.get('industry')?.touched" />
                <small class="error-message" *ngIf="editForm.get('industry')?.invalid && editForm.get('industry')?.touched">
                  Industry is required
                </small>
              </div>
              <div class="form-field">
                <label for="websiteUrl">Website URL</label>
                <input 
                  id="websiteUrl"
                  type="url" 
                  pInputText 
                  formControlName="websiteUrl"
                  placeholder="Enter website URL" />
              </div>
            </div>
          </div>

          <div class="form-section">
            <h4>Owner Information</h4>
            <div class="form-row">
              <div class="form-field">
                <label for="ownerFirstName" class="required">First Name *</label>
                <input 
                  id="ownerFirstName"
                  type="text" 
                  pInputText 
                  formControlName="ownerFirstName"
                  placeholder="Enter first name"
                  [class.ng-invalid]="editForm.get('ownerFirstName')?.invalid && editForm.get('ownerFirstName')?.touched" />
                <small class="error-message" *ngIf="editForm.get('ownerFirstName')?.invalid && editForm.get('ownerFirstName')?.touched">
                  First name is required
                </small>
              </div>
              <div class="form-field">
                <label for="ownerLastName">Last Name</label>
                <input 
                  id="ownerLastName"
                  type="text" 
                  pInputText 
                  formControlName="ownerLastName"
                  placeholder="Enter last name" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-field">
                <label for="ownerEmail" class="required">Email *</label>
                <input 
                  id="ownerEmail"
                  type="email" 
                  pInputText 
                  formControlName="ownerEmail"
                  placeholder="Enter email"
                  [class.ng-invalid]="editForm.get('ownerEmail')?.invalid && editForm.get('ownerEmail')?.touched" />
                <small class="error-message" *ngIf="editForm.get('ownerEmail')?.invalid && editForm.get('ownerEmail')?.touched">
                  Valid email is required
                </small>
              </div>
              <div class="form-field">
                <label for="ownerPhone" class="required">Phone *</label>
                <input 
                  id="ownerPhone"
                  type="tel" 
                  pInputText 
                  formControlName="ownerPhone"
                  placeholder="Enter phone number"
                  [class.ng-invalid]="editForm.get('ownerPhone')?.invalid && editForm.get('ownerPhone')?.touched" />
                <small class="error-message" *ngIf="editForm.get('ownerPhone')?.invalid && editForm.get('ownerPhone')?.touched">
                  Phone number is required
                </small>
              </div>
            </div>
          </div>

          <div class="form-section">
            <h4>Contact Information</h4>
            <div class="form-row">
              <div class="form-field">
                <label for="contactEmail" class="required">Contact Email *</label>
                <input 
                  id="contactEmail"
                  type="email" 
                  pInputText 
                  formControlName="contactEmail"
                  placeholder="Enter contact email"
                  [class.ng-invalid]="editForm.get('contactEmail')?.invalid && editForm.get('contactEmail')?.touched" />
                <small class="error-message" *ngIf="editForm.get('contactEmail')?.invalid && editForm.get('contactEmail')?.touched">
                  Valid contact email is required
                </small>
              </div>
              <div class="form-field">
                <label for="contactPhone" class="required">Contact Phone *</label>
                <input 
                  id="contactPhone"
                  type="tel" 
                  pInputText 
                  formControlName="contactPhone"
                  placeholder="Enter contact phone"
                  [class.ng-invalid]="editForm.get('contactPhone')?.invalid && editForm.get('contactPhone')?.touched" />
                <small class="error-message" *ngIf="editForm.get('contactPhone')?.invalid && editForm.get('contactPhone')?.touched">
                  Contact phone is required
                </small>
              </div>
            </div>
            <div class="form-row">
              <div class="form-field">
                <label for="status">Status</label>
                <p-dropdown 
                  id="status"
                  [options]="statusOptions" 
                  formControlName="status"
                  placeholder="Select status"
                  optionLabel="label"
                  optionValue="value">
                </p-dropdown>
              </div>
              <div class="form-field"></div>
            </div>
          </div>

          <div class="form-section">
            <h4>Addresses</h4>
            <div class="addresses-container">
              <div class="address-item" *ngFor="let address of addresses; let i = index">
                <div class="address-header">
                  <h5>Address {{ i + 1 }}</h5>
                  <button 
                    type="button" 
                    class="remove-address-btn" 
                    (click)="removeAddress(i)"
                    *ngIf="addresses.length > 1">
                    <app-icon-close></app-icon-close>
                  </button>
                </div>
                <div class="form-row">
                  <div class="form-field full-width">
                    <label>Street</label>
                    <input 
                      type="text" 
                      pInputText 
                      [(ngModel)]="address.street"
                      [ngModelOptions]="{standalone: true}"
                      placeholder="Enter street" />
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-field">
                    <label>Complement</label>
                    <input 
                      type="text" 
                      pInputText 
                      [(ngModel)]="address.complement"
                      [ngModelOptions]="{standalone: true}"
                      placeholder="Enter complement" />
                  </div>
                  <div class="form-field">
                    <label>City</label>
                    <input 
                      type="text" 
                      pInputText 
                      [(ngModel)]="address.city"
                      [ngModelOptions]="{standalone: true}"
                      placeholder="Enter city" />
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-field">
                    <label>State</label>
                    <input 
                      type="text" 
                      pInputText 
                      [(ngModel)]="address.state"
                      [ngModelOptions]="{standalone: true}"
                      placeholder="Enter state" />
                  </div>
                  <div class="form-field">
                    <label>Country</label>
                    <input 
                      type="text" 
                      pInputText 
                      [(ngModel)]="address.country"
                      [ngModelOptions]="{standalone: true}"
                      placeholder="Enter country" />
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-field">
                    <label>ZIP Code</label>
                    <input 
                      type="text" 
                      pInputText 
                      [(ngModel)]="address.zipCode"
                      [ngModelOptions]="{standalone: true}"
                      placeholder="Enter ZIP code" 
                      (ngModelChange)="onZipCodeChange(address, $event)" />
                  </div>
                  <div class="form-field"></div>
                </div>
              </div>
              <div class="add-address-btn">
                <button 
                  type="button"
                  class="p-button p-button-secondary p-button-outlined"
                  (click)="addAddress()">
                  <app-icon-upload></app-icon-upload>
                  <span>Add Address</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button 
            type="button"
            class="p-button p-button-secondary p-button-outlined"
            (click)="onCancel()">
            <app-icon-close></app-icon-close>
            <span>Cancel</span>
          </button>
          <button 
            type="submit"
            class="p-button"
            [disabled]="editForm.invalid || loading"
            [class.p-button-loading]="loading">
            <app-icon-check></app-icon-check>
            <span>Save Changes</span>
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .edit-client-modal {
      padding: 1.5rem;
      max-width: 800px;
      margin: 0 auto;
      padding-bottom: 2rem;
      display: flex;
      flex-direction: column;
      min-height: 100%;
    }
    
    .form-content {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      margin-bottom: 1.5rem;
      flex: 1;
    }
    
    .form-section {
      border: 1px solid var(--cor-cinza-medio);
      border-radius: var(--borda-raio-pequeno);
      padding: 1.5rem;
      background-color: var(--cor-branca);
    }
    
    .form-section h4 {
      margin: 0 0 1rem 0;
      color: var(--cor-primaria);
      font-size: var(--fonte-tamanho-medio);
      font-weight: var(--fonte-peso-medio);
      border-bottom: 1px solid var(--cor-cinza-medio);
      padding-bottom: 0.5rem;
    }
    
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
      margin-bottom: 1.5rem;
      align-items: start;
    }
    
    .form-field.full-width {
      grid-column: 1 / -1;
    }
    
    .form-row:last-child {
      margin-bottom: 0;
    }
    
    .form-field {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      min-height: 80px;
    }
    
    .form-field label {
      font-weight: var(--fonte-peso-medio);
      color: var(--cor-cinza-escuro);
      font-size: var(--fonte-tamanho-padrao);
      margin-bottom: 0.5rem;
      display: block;
      line-height: 1.4;
    }
    
    .form-field label.required::after {
      content: " *";
      color: var(--cor-erro);
    }
    
    .form-field input,
    .form-field p-dropdown {
      width: 100%;
      height: 40px;
      box-sizing: border-box;
    }
    
    .form-field input {
      padding: 0.75rem;
      border: 1px solid var(--cor-cinza-medio);
      border-radius: var(--borda-raio-pequeno);
      font-size: var(--fonte-tamanho-padrao);
      line-height: 1.4;
      transition: var(--transicao-rapida);
    }
    
    .form-field input:focus {
      outline: none;
      border-color: var(--cor-primaria);
      box-shadow: 0 0 0 2px rgba(var(--cor-primaria-rgb), 0.1);
    }
    
    .form-field input.ng-invalid {
      border-color: var(--cor-erro) !important;
    }
    
    .error-message {
      color: var(--cor-erro);
      font-size: var(--fonte-tamanho-pequeno);
      margin-top: 0.25rem;
    }
    
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      padding: 1rem 0;
      border-top: 1px solid var(--cor-cinza-medio);
      margin-top: 1.5rem;
      background-color: var(--cor-branca);
    }
    
    .form-actions button {
      min-width: 120px;
      height: var(--altura-botao);
      border-radius: var(--borda-raio-padrao);
      font-size: var(--fonte-tamanho-padrao);
      font-weight: var(--fonte-peso-medio);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      cursor: pointer;
      transition: var(--transicao-rapida);
      border: 1px solid;
    }
    
    .form-actions .p-button-secondary {
      background-color: var(--cor-branca);
      border-color: var(--cor-cinza-medio);
      color: var(--cor-cinza-escuro);
    }
    
    .form-actions .p-button-secondary:hover {
      background-color: var(--cor-cinza-fundo);
      border-color: var(--cor-cinza-escuro);
    }
    
    .form-actions button:not(.p-button-secondary) {
      background-color: var(--cor-primaria);
      border-color: var(--cor-primaria);
      color: var(--cor-branca);
    }
    
    .form-actions button:not(.p-button-secondary):hover {
      background-color: var(--cor-primaria-escura);
      border-color: var(--cor-primaria-escura);
    }
    
    .form-actions button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    
    .form-actions button i {
      font-size: var(--fonte-tamanho-padrao);
    }
    
    .addresses-container {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    
    .address-item {
      border: 1px solid var(--cor-cinza-medio);
      border-radius: var(--borda-raio-pequeno);
      padding: 1.5rem;
      background-color: var(--cor-cinza-fundo);
    }
    
    .address-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid var(--cor-cinza-medio);
    }
    
    .address-header h5 {
      margin: 0;
      color: var(--cor-primaria);
      font-size: var(--fonte-tamanho-padrao);
      font-weight: var(--fonte-peso-medio);
    }
    
    .remove-address-btn {
      background: none;
      border: none;
      color: var(--cor-erro);
      cursor: pointer;
      padding: 0.25rem;
      border-radius: var(--borda-raio-circular);
      transition: var(--transicao-rapida);
      
      &:hover {
        background-color: var(--cor-erro-claro);
      }
      
      i {
        font-size: var(--fonte-tamanho-padrao);
      }
    }
    
    .add-address-btn {
      display: flex;
      justify-content: center;
      margin-top: 1rem;
    }
    
    .add-address-btn button {
      min-width: 150px;
      height: var(--altura-botao);
      border-radius: var(--borda-raio-padrao);
      font-size: var(--fonte-tamanho-padrao);
      font-weight: var(--fonte-peso-medio);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      cursor: pointer;
      transition: var(--transicao-rapida);
      border: 1px solid var(--cor-cinza-medio);
      background-color: var(--cor-branca);
      color: var(--cor-cinza-escuro);
    }
    
    .add-address-btn button:hover {
      background-color: var(--cor-cinza-fundo);
      border-color: var(--cor-cinza-escuro);
    }
    
    @media (max-width: 768px) {
      .edit-client-modal {
        padding: 1rem;
      }
      
      .form-row {
        grid-template-columns: 1fr;
        gap: 1rem;
      }
      
      .form-section {
        padding: 1rem;
      }
      
      .address-item {
        padding: 1rem;
      }
      
      .form-field {
        min-height: 70px;
      }
      
      .form-actions {
        flex-direction: column;
        gap: 0.5rem;
      }
      
      .form-actions button {
        width: 100%;
        min-width: unset;
      }
    }
    
    @media (max-width: 480px) {
      .edit-client-modal {
        padding: 0.75rem;
      }
      
      .form-section {
        padding: 0.75rem;
      }
      
      .address-item {
        padding: 0.75rem;
      }
      
      .form-field input {
        padding: 0.5rem;
        font-size: 14px;
      }
    }
  `]
})
export class EditClientModalComponent implements OnInit {
  editForm: FormGroup;
  loading = false;
  client: Client;
  addresses: Address[] = [];

  statusOptions = [
    { label: 'Active', value: DefaultStatus.ACTIVE },
    { label: 'Inactive', value: DefaultStatus.INACTIVE }
  ];

  constructor(
    private readonly fb: FormBuilder,
    private readonly clientService: ClientService,
    private readonly toastService: ToastService,
    private readonly zipCodeService: ZipCodeService,
    public ref: DynamicDialogRef,
    public config: DynamicDialogConfig,
    private readonly cdr: ChangeDetectorRef
  ) {
    this.client = config.data.client;
  }

  ngOnInit(): void {
    this.initForm();
    this.populateForm();
    this.populateAddresses();
    
    setTimeout(() => {
      this.cdr.detectChanges();
    }, 100);
  }

  private initForm(): void {
    this.editForm = this.fb.group({
      businessName: ['', [Validators.required]],
      identificationNumber: ['', [Validators.required]],
      industry: ['', [Validators.required]],
      websiteUrl: [''],
      status: [DefaultStatus.ACTIVE],
      ownerFirstName: ['', [Validators.required]],
      ownerLastName: [''],
      ownerEmail: ['', [Validators.required, Validators.email]],
      ownerPhone: ['', [Validators.required]],
      contactEmail: ['', [Validators.required, Validators.email]],
      contactPhone: ['', [Validators.required]]
    });
  }

  private populateForm(): void {
    if (this.client) {
      this.editForm.patchValue({
        businessName: this.client.businessName || '',
        identificationNumber: this.client.identificationNumber || this.client.owner?.identificationNumber || '',
        industry: this.client.industry || '',
        websiteUrl: this.client.websiteUrl || '',
        status: this.client.status || DefaultStatus.ACTIVE,
        ownerFirstName: this.client.owner?.firstName || this.client.owner?.name?.split(' ')[0] || '',
        ownerLastName: this.client.owner?.lastName || this.client.owner?.name?.split(' ').slice(1).join(' ') || '',
        ownerEmail: this.client.owner?.email || '',
        ownerPhone: this.client.owner?.phone || '',
        contactEmail: this.client.contact?.email || this.client.owner?.email || '',
        contactPhone: this.client.contact?.phone || this.client.owner?.phone || ''
      });
    }
  }

  private populateAddresses(): void {
    if (this.client?.addresses?.length) {
      this.addresses = this.client.addresses.map((addr, index) => {
        const mappedAddr = {
          id: addr.id,
          street: addr.street || '',
          number: addr.number || '',
          complement: addr.complement || '',
          city: addr.city || '',
          state: addr.state || '',
          country: addr.country || '',
          zipCode: addr.zipCode || '',
          latitude: addr.latitude,
          longitude: addr.longitude,
          coordinatesParams: addr.coordinatesParams
        };
        return mappedAddr;
      });
    } else {
      this.addAddress();
    }
    
    this.cdr.detectChanges();
  }

  addAddress(): void {
    const newAddress: Address = {
      street: '',
      number: '',
      complement: '',
      city: '',
      state: '',
      country: '',
      zipCode: '',
    };
    this.addresses.push(newAddress);
  }

  removeAddress(index: number): void {
    if (this.addresses.length > 1) {
      this.addresses.splice(index, 1);
    }
  }

  onZipCodeChange(address: Address, zipCode: string): void {
    if (zipCode && zipCode.length >= 5) {
      this.zipCodeService.findLocationByZipCode(zipCode).subscribe({
        next: (addressData) => {
          if (addressData) {
            address.city = addressData.city || '';
            address.state = addressData.state || '';
            address.country = addressData.country || '';
            address.latitude = addressData.latitude ? parseFloat(addressData.latitude) : null;
            address.longitude = addressData.longitude ? parseFloat(addressData.longitude) : null;
          }
        },
        error: (error) => {
          console.error('Error fetching ZIP code data:', error);
        }
      });
    }
  }

  onSubmit(): void {
    if (this.editForm.valid && this.addresses.length > 0) {
      this.loading = true;
      
      const formValue = this.editForm.value;
      
      // Converter endereços para AddressRequestDTO
      const addressesDTO: AddressRequestDTO[] = this.addresses
        .filter(addr => addr.street && addr.city)
        .map(addr => ({
          id: addr.id,
          street: addr.street,
          zipCode: addr.zipCode || '',
          city: addr.city,
          state: addr.state || '',
          country: addr.country || '',
          complement: addr.complement,
          latitude: addr.latitude ? Number(addr.latitude) : undefined,
          longitude: addr.longitude ? Number(addr.longitude) : undefined
        }));
      
      const clientRequest: ClientRequestDTO = {
        businessName: formValue.businessName,
        identificationNumber: formValue.identificationNumber,
        industry: formValue.industry,
        websiteUrl: formValue.websiteUrl,
        status: formValue.status,
        contact: {
          email: formValue.contactEmail,
          phone: formValue.contactPhone
        },
        owner: {
          identificationNumber: formValue.identificationNumber,
          firstName: formValue.ownerFirstName,
          lastName: formValue.ownerLastName,
          email: formValue.ownerEmail,
          phone: formValue.ownerPhone
        },
        addresses: addressesDTO
      };

      this.clientService.editar(this.client.id || '', clientRequest).subscribe({
        next: (response) => {
          this.toastService.sucesso('Client updated successfully');
          this.ref.close({ success: true, client: { ...this.client, ...formValue } });
          this.loading = false;
        },
        error: (error) => {
          console.error('Error updating client:', error);
          this.toastService.erro('Failed to update client');
          this.loading = false;
        }
      });
    } else {
      this.toastService.erro('Please fill all required fields and add at least one address');
    }
  }

  onCancel(): void {
    this.ref.close({ success: false });
  }
} 