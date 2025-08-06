import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ZipCodeService } from '@app/core/service/api/zipcode.service';
import { AddressData } from '@app/model/dto/request/address-data-request';
import { UpdateMonitorRequestDto } from '@app/model/dto/request/create-monitor.request.dto';
import { Monitor, MonitorType } from '@app/model/monitors';
import { PrimengModule } from '@app/shared/primeng/primeng.module';
import { debounceTime, distinctUntilChanged, Observable, of, switchMap } from 'rxjs';

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
  @Output() monitorUpdated = new EventEmitter<{ id: string; data: UpdateMonitorRequestDto }>();

  monitorForm: FormGroup;
  loadingZipCode = false;
  monitorTypes = Object.values(MonitorType);

  constructor(
    private readonly fb: FormBuilder,
    private readonly zipCodeService: ZipCodeService
  ) {
    this.monitorForm = this.fb.group({
      size: [null, [Validators.required, Validators.min(0.01), Validators.max(999.99)]],
      type: [null, [Validators.required]],
      active: [true, [Validators.required]],
      locationDescription: ['', [Validators.maxLength(200)]],
      address: this.fb.group({
        id: [''],
        street: ['', [Validators.required, Validators.maxLength(100)]],
        zipCode: ['', [Validators.required, Validators.pattern(/^\d{5}$/)]],
        city: ['', [Validators.required, Validators.maxLength(50)]],
        state: ['', [Validators.required, Validators.pattern(/^[A-Za-z]{2}$/)]],
        country: ['US', [Validators.maxLength(100)]],
        complement: ['', [Validators.maxLength(100)]],
        latitude: [null],
        longitude: [null]
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

    const formData = {
      size: this.monitor.size ?? 0,
      type: this.monitor.type ?? MonitorType.BASIC,
      active: this.monitor.active ?? true,
      locationDescription: this.monitor.locationDescription ?? '',
      address: {
        id: this.monitor.address?.id ?? '',
        street: this.monitor.address?.street ?? '',
        zipCode: this.monitor.address?.zipCode ?? '',
        city: this.monitor.address?.city ?? '',
        state: this.monitor.address?.state ?? '',
        country: this.monitor.address?.country ?? 'US',
        complement: this.monitor.address?.complement ?? '',
        latitude: this.monitor.address?.latitude ?? null,
        longitude: this.monitor.address?.longitude ?? null
      }
    };

    this.monitorForm.patchValue(formData);
    this.monitorForm.markAllAsTouched();
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
      
      const monitorRequest: UpdateMonitorRequestDto = {
        size: formValue.size,
        type: formValue.type,
        active: formValue.active,
        locationDescription: formValue.locationDescription,
        address: {
          id: addressValue.id,
          street: addressValue.street,
          city: addressValue.city,
          state: addressValue.state,
          country: addressValue.country,
          zipCode: addressValue.zipCode,
          complement: addressValue.complement ?? null,
          latitude: addressValue.latitude ?? null,
          longitude: addressValue.longitude ?? null
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
