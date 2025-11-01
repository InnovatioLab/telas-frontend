import { CommonModule } from "@angular/common";
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from "@angular/core";
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { ZipCodeService } from "@app/core/service/api/zipcode.service";
import { AddressData } from "@app/model/dto/request/address-data-request";
import {
  CreateMonitorRequestDto,
  UpdateMonitorRequestDto,
} from "@app/model/dto/request/create-monitor.request.dto";
import { Monitor } from "@app/model/monitors";
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
  selector: "app-monitor-modal",
  standalone: true,
  imports: [CommonModule, PrimengModule, ReactiveFormsModule],
  templateUrl: "./monitor-modal.component.html",
  styleUrls: ["./monitor-modal.component.scss"],
})
export class MonitorModalComponent implements OnInit, OnChanges {
  @Input() mode: "create" | "edit" = "create";
  @Input() monitor: Monitor | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() monitorCreated = new EventEmitter<CreateMonitorRequestDto>();
  @Output() monitorUpdated = new EventEmitter<{
    id: string;
    data: UpdateMonitorRequestDto;
  }>();

  monitorForm: FormGroup;
  loadingZipCode = false;

  constructor(
    private readonly fb: FormBuilder,
    private readonly zipCodeService: ZipCodeService
  ) {
    this.monitorForm = this.fb.group({
      active: [true, [Validators.required]],
      locationDescription: ["", [Validators.maxLength(255)]],
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
        address2: ["", [Validators.maxLength(100)]],
      }),
    });
  }

  ngOnInit(): void {
    this.setupZipCodeSearch();
    if (this.mode === "edit" && this.monitor) {
      this.patchFormWithMonitor(this.monitor);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["monitor"] && this.monitor && this.mode === "edit") {
      this.patchFormWithMonitor(this.monitor);
    }
    if (changes["mode"] && this.mode === "create") {
      this.monitorForm.reset({
        active: true,
        locationDescription: "",
        address: {
          street: "",
          zipCode: "",
          city: "",
          state: "",
          country: "US",
          address2: "",
        },
      });
    }
  }

  private patchFormWithMonitor(monitor: Monitor): void {
    this.monitorForm.patchValue({
      active: monitor.active,
      locationDescription: monitor.locationDescription,
      address: {
        street: monitor.address?.street ?? "",
        zipCode: monitor.address?.zipCode ?? "",
        city: monitor.address?.city ?? "",
        state: monitor.address?.state ?? "",
        country: monitor.address?.country ?? "US",
        address2: monitor.address?.address2 ?? "",
      },
    });
  }

  private setupZipCodeSearch(): void {
    const zipCodeControl = this.monitorForm.get("address.zipCode");
    if (zipCodeControl) {
      zipCodeControl.valueChanges
        .pipe(
          debounceTime(500),
          distinctUntilChanged(),
          switchMap((zipCode: string): Observable<AddressData | null> => {
            if (zipCode && zipCode.length === 5 && /^[0-9]{5}$/.test(zipCode)) {
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
          error: () => {
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

  submit(): void {
    if (this.monitorForm.valid) {
      const formValue = this.monitorForm.value;
      const addressValue = formValue.address;
      if (this.mode === "create") {
        const monitorRequest: CreateMonitorRequestDto = {
          locationDescription: formValue.locationDescription,
          address: {
            street: addressValue.street,
            city: addressValue.city,
            state: addressValue.state,
            country: addressValue.country,
            zipCode: addressValue.zipCode,
            address2: addressValue.address2 ?? null,
          },
        };
        this.monitorCreated.emit(monitorRequest);
        this.closeModal();
      } else if (this.mode === "edit" && this.monitor) {
        const updateRequest: UpdateMonitorRequestDto = {
          active: formValue.active,
          locationDescription: formValue.locationDescription,
          address: {
            street: addressValue.street,
            city: addressValue.city,
            state: addressValue.state,
            country: addressValue.country,
            zipCode: addressValue.zipCode,
            address2: addressValue.address2 ?? null,
          },
        };
        this.monitorUpdated.emit({ id: this.monitor.id, data: updateRequest });
        this.closeModal();
      }
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
