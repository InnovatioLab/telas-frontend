import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component, OnInit } from "@angular/core";
import {
  FormArray,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { TextOnlyDirective } from "@app/core/directives/text-only.directive";
import { ClientService } from "@app/core/service/api/client.service";
import { ZipCodeService } from "@app/core/service/api/zipcode.service";
import { ToastService } from "@app/core/service/state/toast.service";
import { Client, DefaultStatus } from "@app/model/client";
import {
  AddressRequestDTO,
  ClientRequestDTO,
} from "@app/model/dto/request/client-request.dto";
import { ErrorComponent } from "@app/shared";
import { IconCheckComponent } from "@app/shared/icons/check.icon";
import { IconCloseComponent } from "@app/shared/icons/close.icon";
import { IconUploadComponent } from "@app/shared/icons/upload.icon";
import { PrimengModule } from "@app/shared/primeng/primeng.module";
import { AbstractControlUtils } from "@app/shared/utils/abstract-control.utils";
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { DropdownModule } from "primeng/dropdown";
import { DynamicDialogConfig, DynamicDialogRef } from "primeng/dynamicdialog";
import { InputTextModule } from "primeng/inputtext";

@Component({
  selector: "app-edit-client-modal",
  standalone: true,
  imports: [
    CommonModule,
    ErrorComponent,
    PrimengModule,
    ReactiveFormsModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    DropdownModule,
    CardModule,
    IconCloseComponent,
    IconCheckComponent,
    IconUploadComponent,
    TextOnlyDirective,
  ],
  templateUrl: "./edit-client-modal.component.html",
  styleUrls: ["./edit-client-modal.component.scss"],
})
export class EditClientModalComponent implements OnInit {
  editForm: FormGroup;
  loading = false;
  client: Client;

  get addressesFormArray(): FormArray {
    return this.editForm.get("addresses") as FormArray;
  }

  getAddressGroup(index: number): FormGroup {
    return this.addressesFormArray.at(index) as FormGroup;
  }

  statusOptions = [
    { label: "Active", value: DefaultStatus.ACTIVE },
    { label: "Inactive", value: DefaultStatus.INACTIVE },
  ];

  constructor(
    private fb: FormBuilder,
    private clientService: ClientService,
    private toastService: ToastService,
    private zipCodeService: ZipCodeService,
    public ref: DynamicDialogRef,
    public config: DynamicDialogConfig,
    private cdr: ChangeDetectorRef
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
      businessName: ["", [Validators.required, Validators.maxLength(255)]],
      industry: ["", [Validators.maxLength(50)]],
      websiteUrl: [
        "",
        [Validators.maxLength(255), AbstractControlUtils.validateUrl()],
      ],
      status: [DefaultStatus.ACTIVE],
      contactEmail: [
        "",
        [Validators.required, Validators.email, Validators.maxLength(255)],
      ],
      contactPhone: [
        "",
        [Validators.required, AbstractControlUtils.validatePhone()],
      ],
      addresses: this.fb.array([]),
    });
  }

  private populateForm(): void {
    if (this.client) {
      this.editForm.patchValue({
        businessName: this.client.businessName || "",
        industry: this.client.industry ?? "",
        websiteUrl: this.client.websiteUrl || "",
        status: this.client.status || DefaultStatus.ACTIVE,
        contactEmail: this.client.contact.email,
        contactPhone: this.client.contact.phone,
      });
    }
  }

  private populateAddresses(): void {
    const addressesArray = this.editForm.get("addresses") as FormArray;
    addressesArray.clear();
    if (
      this.client &&
      this.client.addresses &&
      this.client.addresses.length > 0
    ) {
      this.client.addresses.forEach((addr) => {
        addressesArray.push(
          this.fb.group({
            id: [addr.id],
            street: [
              addr.street,
              [
                Validators.required,
                Validators.maxLength(100),
                AbstractControlUtils.validateStreet(),
              ],
            ],
            zipCode: [addr.zipCode, Validators.required],
            city: [addr.city, [Validators.required, Validators.maxLength(50)]],
            state: [
              addr.state,
              [
                Validators.required,
                Validators.maxLength(2),
                Validators.minLength(2),
              ],
            ],
            country: [
              addr.country ?? "US",
              [Validators.required, Validators.maxLength(100)],
            ],
            address2: [addr.address2 ?? null, Validators.maxLength(100)],
          })
        );
      });
    } else {
      this.addAddress();
    }
    this.cdr.detectChanges();
  }

  addAddress(): void {
    const addressesArray = this.editForm.get("addresses") as FormArray;

    addressesArray.push(
      this.fb.group({
        id: [null],
        street: [
          "",
          [
            Validators.required,
            Validators.maxLength(100),
            AbstractControlUtils.validateStreet(),
          ],
        ],
        zipCode: ["", Validators.required],
        city: ["", [Validators.required, Validators.maxLength(50)]],
        state: [
          "",
          [
            Validators.required,
            Validators.maxLength(2),
            Validators.minLength(2),
          ],
        ],
        country: ["US", Validators.maxLength(100)],
        address2: ["", Validators.maxLength(100)],
      })
    );
  }

  removeAddress(index: number): void {
    const addressesArray = this.editForm.get("addresses") as FormArray;
    if (addressesArray.length > 1) {
      addressesArray.removeAt(index);
    }
  }

  onZipCodeChange(addressGroup: FormGroup, zipCode: string): void {
    if (zipCode && zipCode.length >= 5) {
      this.zipCodeService.findLocationByZipCode(zipCode).subscribe({
        next: (addressData) => {
          if (addressData) {
            addressGroup.patchValue({
              city: addressData.city || "",
              state: addressData.state || "",
              country: addressData.country || "",
            });
          }
        },
        error: (error) => {
        },
      });
    }
  }

  onSubmit(): void {
    if (this.editForm.valid && this.addressesFormArray.length > 0) {
      this.loading = true;
      const formValue = this.editForm.getRawValue();
      const addressesDTO: AddressRequestDTO[] = formValue.addresses.map(
        (addr: any) => ({
          id: addr.id ?? null,
          street: addr.street,
          zipCode: addr.zipCode,
          city: addr.city,
          state: addr.state,
          country: addr.country,
          address2: addr.address2 ?? null,
        })
      );
      const normalizePhone = (value: string): string =>
        (value || "").replace(/\D/g, "");
      const clientRequest: ClientRequestDTO = {
        businessName: formValue.businessName,
        industry: formValue.industry,
        websiteUrl: formValue.websiteUrl,
        status: formValue.status,
        contact: {
          email: formValue.contactEmail,
          phone: normalizePhone(formValue.contactPhone),
        },
        addresses: addressesDTO,
      };
      this.clientService.editar(this.client.id!, clientRequest).subscribe({
        next: (response) => {
          this.toastService.sucesso("Client updated successfully");
          this.ref.close({
            success: true,
            client: { ...this.client, ...formValue },
          });
          this.loading = false;
        },
        error: (error) => {
          this.toastService.erro("Failed to update client");
          this.loading = false;
        },
      });
    } else {
      this.toastService.erro(
        "Please fill all required fields and add at least one address"
      );
    }
  }

  onCancel(): void {
    this.ref.close({ success: false });
  }
}
