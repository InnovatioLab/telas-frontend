import { CommonModule } from "@angular/common";
import { Component, EventEmitter, OnInit, Output } from "@angular/core";
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { ZipCodeService } from "@app/core/service/api/zipcode.service";
import { AddressData } from "@app/model/dto/request/address-data-request";
import { CreateMonitorRequestDto } from "@app/model/dto/request/create-monitor.request.dto";
import { PrimengModule } from "@app/shared/primeng/primeng.module";
import { AbstractControlUtils } from "@app/shared/utils/abstract-control.utils";
import {
  debounceTime,
  distinctUntilChanged,
  Observable,
  of,
  switchMap,
} from "rxjs";

@Component({
  selector: "app-create-monitor-modal",
  standalone: true,
  imports: [CommonModule, PrimengModule, ReactiveFormsModule],
  templateUrl: "./create-monitor-modal.component.html",
  styleUrls: ["./create-monitor-modal.component.scss"],
})
export class CreateMonitorModalComponent implements OnInit {
  @Output() close = new EventEmitter<void>();
  @Output() monitorCreated = new EventEmitter<CreateMonitorRequestDto>();

  monitorForm: FormGroup;

  loadingZipCode = false;

  constructor(
    private readonly fb: FormBuilder,
    private readonly zipCodeService: ZipCodeService
  ) {
    this.monitorForm = this.fb.group({
      size: [
        null,
        [Validators.required, Validators.min(1.00), Validators.max(999.99)],
      ],
      locationDescription: ["", [Validators.maxLength(200)]],
      address: this.fb.group({
        street: [
          "",
          [
            Validators.required,
            Validators.maxLength(100),
            AbstractControlUtils.validateStreet(),
          ],
        ],
        zipCode: ["", [Validators.required, Validators.pattern(/^\d{5}$/)]],
        city: ["", [Validators.required, Validators.maxLength(50)]],
        state: [
          "",
          [
            Validators.required,
            Validators.minLength(2),
            Validators.maxLength(2),
          ],
        ],
        country: ["US", [Validators.maxLength(100)]],
        complement: ["", [Validators.maxLength(100)]],
      }),
    });
  }

  ngOnInit(): void {
    this.setupZipCodeSearch();
  }

  private setupZipCodeSearch(): void {
    const zipCodeControl = this.monitorForm.get("address.zipCode");

    if (zipCodeControl) {
      zipCodeControl.valueChanges
        .pipe(
          debounceTime(500),
          distinctUntilChanged(),
          switchMap((zipCode: string): Observable<AddressData | null> => {
            if (zipCode && zipCode.length === 5 && /^\d{5}$/.test(zipCode)) {
              this.loadingZipCode = true;
              return this.zipCodeService.findLocationByZipCode(zipCode);
            }
            return of(null);
          })
        )
        .subscribe({
          next: (addressData) => {
            this.loadingZipCode = false;
            if (addressData) {
              this.fillAddressFields(addressData);
            }
          },
          error: (error) => {
            this.loadingZipCode = false;
          },
        });
    }
  }

  private fillAddressFields(addressData: AddressData): void {
    const addressGroup = this.monitorForm.get("address");

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
    if (this.monitorForm.valid) {
      const formValue = this.monitorForm.value;
      const addressValue = formValue.address;

      const monitorRequest: CreateMonitorRequestDto = {
        size: formValue.size,
        locationDescription: formValue.locationDescription,
        address: {
          street: addressValue.street,
          city: addressValue.city,
          state: addressValue.state,
          country: addressValue.country,
          zipCode: addressValue.zipCode,
          complement: addressValue.complement ?? null,
        },
      };

      this.monitorCreated.emit(monitorRequest);
      this.closeModal();
    } else {
      Object.keys(this.monitorForm.controls).forEach((key) => {
        const control = this.monitorForm.get(key);
        control?.markAsTouched();
      });

      const addressGroup = this.monitorForm.get("address") as FormGroup;
      if (addressGroup) {
        Object.keys(addressGroup.controls).forEach((key) => {
          const control = addressGroup.get(key);
          control?.markAsTouched();
        });
      }
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
      if (control.errors["required"]) return "This field is required";
      if (control.errors["maxlength"])
        return `Maximum ${control.errors["maxlength"].requiredLength} characters`;
      if (control.errors["pattern"]) return "Invalid format";
      if (control.errors["min"])
        return `Minimum value is ${control.errors["min"].min}`;
      if (control.errors["max"])
        return `Maximum value is ${control.errors["max"].max}`;
    }
    return "";
  }
}
