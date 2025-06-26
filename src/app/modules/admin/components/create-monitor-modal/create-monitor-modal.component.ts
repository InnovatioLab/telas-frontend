import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { PrimengModule } from '@app/shared/primeng/primeng.module';
import { MonitorType } from '@app/model/monitors';
import { CreateMonitorRequestDto } from '@app/model/dto/request/create-monitor.request.dto';
import { DisplayType } from '@app/model/enums/display-type.enum';
import { ZipCodeService } from '@app/core/service/api/zipcode.service';
import { debounceTime, distinctUntilChanged, switchMap, Observable, of } from 'rxjs';
import { AddressData } from '@app/model/dto/request/address-data-request';

@Component({
  selector: 'app-create-monitor-modal',
  standalone: true,
  imports: [
    CommonModule,
    PrimengModule,
    ReactiveFormsModule
  ],
  templateUrl: './create-monitor-modal.component.html',
  styleUrls: ['./create-monitor-modal.component.scss']
})
export class CreateMonitorModalComponent {
  @Output() close = new EventEmitter<void>();
  @Output() monitorCreated = new EventEmitter<CreateMonitorRequestDto>();

  monitorForm: FormGroup;
  monitorTypes = [
    { label: 'Basic', value: MonitorType.BASIC },
    { label: 'Premium', value: MonitorType.PREMIUM }
  ];

  displayTypes = [
    { label: 'Continuous', value: DisplayType.CONTINUOUS },
    { label: 'Interleaved', value: DisplayType.INTERLEAVED }
  ];

  loadingZipCode = false;

  constructor(
    private readonly fb: FormBuilder,
    private readonly zipCodeService: ZipCodeService
  ) {
    this.monitorForm = this.fb.group({
      // Campos do monitor (sem productId - API já trata)
      size: [null, [Validators.min(0.01), Validators.max(999.99)]],
      address: this.fb.group({
        street: ['', [Validators.required, Validators.maxLength(100)]],
        zipCode: ['', [Validators.required, Validators.pattern(/^\d{5}$/)]],
        city: ['', [Validators.required, Validators.maxLength(50)]],
        state: ['', [Validators.required, Validators.pattern(/^[A-Za-z]{2}$/)]],
        country: ['', [Validators.maxLength(100)]],
        complement: ['', [Validators.maxLength(100)]],
        latitude: [null],
        longitude: [null]
      }),
      maxBlocks: [null, [Validators.min(1)]],
      locationDescription: ['', [Validators.maxLength(255)]],
      type: [MonitorType.BASIC, Validators.required],
      active: [true],
      ads: this.fb.array([])
    });

    // Configurar busca automática de CEP
    this.setupZipCodeSearch();
  }

  private setupZipCodeSearch(): void {
    const zipCodeControl = this.monitorForm.get('address.zipCode');
    
    if (zipCodeControl) {
      zipCodeControl.valueChanges.pipe(
        debounceTime(500), // Aguardar 500ms após o usuário parar de digitar
        distinctUntilChanged(), // Só executar se o valor mudou
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
      // Preencher campos automaticamente
      if (addressData.city) {
        addressGroup.patchValue({ city: addressData.city });
      }
      if (addressData.state) {
        addressGroup.patchValue({ state: addressData.state });
      }
      if (addressData.country) {
        addressGroup.patchValue({ country: addressData.country });
      }
      if (addressData.latitude) {
        addressGroup.patchValue({ latitude: parseFloat(addressData.latitude) });
      }
      if (addressData.longitude) {
        addressGroup.patchValue({ longitude: parseFloat(addressData.longitude) });
      }
    }
  }

  get adsArray(): FormArray {
    return this.monitorForm.get('ads') as FormArray;
  }

  addAd(): void {
    const adGroup = this.fb.group({
      id: ['', Validators.required],
      displayType: [DisplayType.INTERLEAVED],
      orderIndex: [this.adsArray.length + 1, [Validators.required, Validators.min(1)]]
    });
    this.adsArray.push(adGroup);
  }

  removeAd(index: number): void {
    this.adsArray.removeAt(index);
    // Reajustar orderIndex
    this.adsArray.controls.forEach((control, i) => {
      control.get('orderIndex')?.setValue(i + 1);
    });
  }

  submit(): void {
    if (this.monitorForm.valid) {
      const formValue = this.monitorForm.value;
      
      // Preparar o objeto para envio
      const monitorRequest: CreateMonitorRequestDto = {
        type: formValue.type,
        active: formValue.active,
        address: {
          street: formValue.address.street,
          zipCode: formValue.address.zipCode,
          city: formValue.address.city,
          state: formValue.address.state,
          country: formValue.address.country || 'US',
          complement: formValue.address.complement || undefined,
          latitude: formValue.address.latitude || undefined,
          longitude: formValue.address.longitude || undefined
        }
      };

      // Adicionar campos opcionais apenas se preenchidos
      if (formValue.size) {
        monitorRequest.size = formValue.size;
      }
      if (formValue.maxBlocks) {
        monitorRequest.maxBlocks = formValue.maxBlocks;
      }
      if (formValue.locationDescription) {
        monitorRequest.locationDescription = formValue.locationDescription;
      }
      if (formValue.ads && formValue.ads.length > 0) {
        monitorRequest.ads = formValue.ads;
      }

      console.log('Payload final para API:', monitorRequest);
      this.monitorCreated.emit(monitorRequest);
      this.close.emit();
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.monitorForm.controls).forEach(key => {
      const control = this.monitorForm.get(key);
      if (control instanceof FormGroup) {
        Object.keys(control.controls).forEach(nestedKey => {
          control.get(nestedKey)?.markAsTouched();
        });
      } else {
        control?.markAsTouched();
      }
    });
  }

  cancel(): void {
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