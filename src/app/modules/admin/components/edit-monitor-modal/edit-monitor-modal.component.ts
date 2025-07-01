import { Component, EventEmitter, Input, Output, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { PrimengModule } from '@app/shared/primeng/primeng.module';
import { CreateMonitorRequestDto } from '@app/model/dto/request/create-monitor.request.dto';
import { Monitor } from '@app/model/monitors';
import { ZipCodeService } from '@app/core/service/api/zipcode.service';
import { debounceTime, distinctUntilChanged, switchMap, Observable, of } from 'rxjs';
import { AddressData } from '@app/model/dto/request/address-data-request';

@Component({
  selector: 'app-edit-monitor-modal',
  standalone: true,
  imports: [
    CommonModule,
    PrimengModule,
    ReactiveFormsModule
  ],
  templateUrl: './edit-monitor-modal.component.html',
  styleUrls: ['./edit-monitor-modal.component.scss']
})
export class EditMonitorModalComponent implements OnInit, OnChanges {
  @Input() monitor: Monitor | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() monitorUpdated = new EventEmitter<{ id: string; data: CreateMonitorRequestDto }>();

  monitorForm: FormGroup;
  loadingZipCode = false;

  constructor(
    private readonly fb: FormBuilder,
    private readonly zipCodeService: ZipCodeService
  ) {
    this.monitorForm = this.fb.group({
      size: [null, [Validators.required, Validators.min(0.01), Validators.max(999.99)]],
      address: this.fb.group({
        street: ['', [Validators.required, Validators.maxLength(100)]],
        zipCode: ['', [Validators.required, Validators.pattern(/^\d{5}$/)]],
        city: ['', [Validators.required, Validators.maxLength(50)]],
        state: ['', [Validators.required, Validators.pattern(/^[A-Za-z]{2}$/)]],
        country: ['US', [Validators.maxLength(100)]],
        complement: ['', [Validators.maxLength(100)]]
      })
    });
  }

  ngOnInit(): void {
    this.setupZipCodeSearch();
    if (this.monitor) {
      this.populateForm();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['monitor'] && this.monitor && this.monitorForm) {
      this.populateForm();
    }
  }

  private populateForm(): void {
    if (!this.monitor) return;

    console.log('Populating form with monitor:', this.monitor);

    const formData = {
      size: this.monitor.size || 0,
      address: {
        street: this.monitor.address?.street || '',
        zipCode: this.monitor.address?.zipCode || '',
        city: this.monitor.address?.city || '',
        state: this.monitor.address?.state || '',
        country: this.monitor.address?.country || 'US',
        complement: this.monitor.address?.complement || ''
      }
    };

    console.log('Form data to patch:', formData);
    this.monitorForm.patchValue(formData);
    console.log('Form values after patch:', this.monitorForm.value);
  }

  private setupZipCodeSearch(): void {
    const zipCodeControl = this.monitorForm.get('address.zipCode');
    
    if (zipCodeControl) {
      zipCodeControl.valueChanges.pipe(
        debounceTime(500), 
        distinctUntilChanged(), 
        switchMap((zipCode: string): Observable<AddressData | null> => {
          if (zipCode && zipCode.length === 5 && /^\d{5}$/.test(zipCode)) {
            this.loadingZipCode = true;
            return this.zipCodeService.findLocationByZipCode(zipCode);
          }
          return of(null);
        })
      ).subscribe({
        next: (addressData) => {
          this.loadingZipCode = false;
          if (addressData) {
            this.fillAddressFields(addressData);
          }
        },
        error: (error) => {
          this.loadingZipCode = false;
          console.error('Erro ao buscar CEP:', error);
        }
      });
    }
  }

  private fillAddressFields(addressData: AddressData): void {
    const addressGroup = this.monitorForm.get('address');
    
    if (addressGroup && addressData) {
      if (addressData.city) {
        addressGroup.patchValue({ city: addressData.city });
      }
      if (addressData.state) {
        addressGroup.patchValue({ state: addressData.state });
      }
      if (addressData.country) {
        addressGroup.patchValue({ country: addressData.country });
      }
    }
  }

  onSubmit(): void {
    if (this.monitorForm.valid && this.monitor) {
      const formValue = this.monitorForm.value;
      const addressValue = formValue.address;
      
      const monitorRequest: CreateMonitorRequestDto = {
        size: formValue.size,
        address: {
          street: addressValue.street,
          city: addressValue.city,
          state: addressValue.state,
          country: addressValue.country,
          zipCode: addressValue.zipCode,
          complement: addressValue.complement ?? null
        }
      };

      this.monitorUpdated.emit({
        id: this.monitor.id,
        data: monitorRequest
      });
      this.closeModal();
    }
  }

  submit(): void {
    this.onSubmit();
  }

  cancel(): void {
    this.closeModal();
  }

  closeModal(): void {
    this.monitorForm.reset();
    this.close.emit();
  }

  getFieldError(fieldName: string, nestedField?: string): string {
    const control = nestedField 
      ? this.monitorForm.get(fieldName)?.get(nestedField)
      : this.monitorForm.get(fieldName);
    
    if (control?.errors && control.touched) {
      if (control.errors['required']) return 'This field is required';
      if (control.errors['maxlength']) return `Maximum ${control.errors['maxlength'].requiredLength} characters`;
      if (control.errors['pattern']) return 'Invalid format';
      if (control.errors['min']) return `Minimum value is ${control.errors['min'].min}`;
      if (control.errors['max']) return `Maximum value is ${control.errors['max'].max}`;
    }
    return '';
  }
}
