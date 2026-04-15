import { CommonModule } from "@angular/common";
import { Component, EventEmitter, OnInit, Output } from "@angular/core";
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { ClientService } from "@app/core/service/api/client.service";
import {
  SmartPlugAdminDto,
  SmartPlugAdminService,
} from "@app/core/service/api/smart-plug-admin.service";
import { ZipCodeService } from "@app/core/service/api/zipcode.service";
import { AddressData } from "@app/model/dto/request/address-data-request";
import { CreateMonitorRequestDto } from "@app/model/dto/request/create-monitor.request.dto";
import { Role } from "@app/model/client";
import { PrimengModule } from "@app/shared/primeng/primeng.module";
import { AbstractControlUtils } from "@app/shared/utils/abstract-control.utils";
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  Observable,
  of,
  switchMap,
  take,
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
  @Output() monitorCreated = new EventEmitter<{
    request: CreateMonitorRequestDto;
    smartPlugId: string | null;
  }>();

  monitorForm: FormGroup;

  loadingZipCode = false;
  isDeveloper = false;
  plugOptions: { label: string; value: string }[] = [];

  constructor(
    private readonly fb: FormBuilder,
    private readonly zipCodeService: ZipCodeService,
    private readonly clientService: ClientService,
    private readonly smartPlugAdmin: SmartPlugAdminService
  ) {
    this.monitorForm = this.fb.group({
      locationDescription: ["", [Validators.maxLength(200)]],
      smartPlugId: [""],
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
        country: ["US", [Validators.required, Validators.maxLength(100)]],
        address2: ["", [Validators.maxLength(100)]],
      }),
    });
  }

  ngOnInit(): void {
    this.setupZipCodeSearch();
    this.clientService.clientAtual$
      .pipe(take(1))
      .subscribe((client) => {
        this.isDeveloper = client?.role === Role.DEVELOPER;
        if (this.isDeveloper) {
          this.loadPlugOptions();
        }
      });
  }

  private loadPlugOptions(): void {
    this.smartPlugAdmin.listUnassigned().subscribe({
      next: (list) => {
        this.plugOptions = [
          { label: "Nenhuma", value: "" },
          ...list.map((p) => ({
            label: this.formatPlugLabel(p),
            value: p.id,
          })),
        ];
      },
    });
  }

  reloadPlugOptions(): void {
    if (!this.isDeveloper) {
      return;
    }
    this.loadPlugOptions();
  }

  private formatPlugLabel(p: SmartPlugAdminDto): string {
    const name = p.displayName?.trim() || p.macAddress;
    return `${name} — ${p.vendor} (${p.macAddress})`;
  }

  private setupZipCodeSearch(): void {
    // const zipCodeControl = this.monitorForm.get("address.zipCode");

    // if (zipCodeControl) {
    //   zipCodeControl.valueChanges
    //     .pipe(
    //       debounceTime(500),
    //       distinctUntilChanged(),
    //       filter((zipCode: string) => {
    //         return zipCode && zipCode.length === 5 && /^\d{5}$/.test(zipCode);
    //       }),
    //       switchMap((zipCode: string): Observable<AddressData | null> => {
    //         if (zipCode) {
    //           this.loadingZipCode = true;
    //           return this.zipCodeService.findLocationByZipCode(zipCode);
    //         }
    //         return of(null);
    //       })
    //     )
    //     .subscribe({
    //       next: (addressData) => {
    //         this.loadingZipCode = false;
    //         if (addressData) {
    //           this.fillAddressFields(addressData);
    //         }
    //       },
    //       error: (error) => {
    //         this.loadingZipCode = false;
    //       },
    //     });
    // }
  }

  private fillAddressFields(addressData: AddressData): void {
    const addressGroup = this.monitorForm.get("address");

    const fields: Array<keyof AddressData & string> = [
      "street",
      "city",
      "state",
      "country",
    ];

    const { payload, touched } = fields.reduce(
      (acc, field) => {
        const value = (addressData as any)[field];
        if (value != null && value !== "") {
          acc.payload[field] = value;
          acc.touched.push(field);
        }
        return acc;
      },
      { payload: {} as Partial<Record<string, any>>, touched: [] as string[] }
    );

    // Garantir que o country sempre tenha um valor
    if (!payload.country || payload.country === "") {
      payload.country = "US";
      touched.push("country");
    }

    if (Object.keys(payload).length > 0) {
      addressGroup.patchValue(payload);
      for (const name of touched) {
        addressGroup.get(name)?.markAsTouched();
      }
    }
  }

  onSubmit(): void {
    if (this.monitorForm.valid) {
      const formValue = this.monitorForm.value;
      const addressValue = formValue.address;

      const monitorRequest: CreateMonitorRequestDto = {
        locationDescription: formValue.locationDescription,
        address: {
          street: addressValue.street,
          city: addressValue.city,
          state: addressValue.state,
          country: addressValue.country || "US",
          zipCode: addressValue.zipCode,
          address2: addressValue.address2 ?? null,
        },
      };

      const rawPlug = formValue.smartPlugId as string;
      const smartPlugId =
        this.isDeveloper && rawPlug && rawPlug.length > 0 ? rawPlug : null;

      this.monitorCreated.emit({ request: monitorRequest, smartPlugId });
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
    this.monitorForm.reset({
      locationDescription: "",
      smartPlugId: "",
      address: {
        street: "",
        zipCode: "",
        city: "",
        state: "",
        country: "US",
        address2: "",
      },
    });
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
