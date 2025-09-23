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
      identificationNumber: [
        "",
        [
          Validators.required,
          Validators.minLength(9),
          Validators.maxLength(9),
          Validators.pattern("^[0-9]{9}$"),
        ],
      ],
      industry: [
        "",
        [
          Validators.maxLength(50),
          Validators.pattern("^[a-zA-ZÀ-ÖØ-öø-ÿ\\s]*$"),
          Validators.required,
        ],
      ],
      websiteUrl: [
        "",
        [Validators.maxLength(200), Validators.pattern("https?://.+")],
      ],
      status: [DefaultStatus.ACTIVE],
      ownerFirstName: ["", [Validators.required, Validators.maxLength(50)]],
      ownerLastName: ["", [Validators.maxLength(150)]],
      ownerEmail: ["", [Validators.email]],
      ownerPhone: [""],
      contactEmail: ["", [Validators.required, Validators.email]],
      contactPhone: [
        "",
        [
          Validators.required,
          Validators.pattern(/^\+[0-9]{1,3}\s[0-9]{3}\s[0-9]{3}\s[0-9]{4}$/),
        ],
      ],
      addresses: this.fb.array([]),
    });
  }

  private populateForm(): void {
    if (this.client) {
      this.editForm.patchValue({
        businessName: this.client.businessName || "",
        identificationNumber:
          this.client.identificationNumber ||
          this.client.owner?.identificationNumber ||
          "",
        industry: this.client.industry || "",
        websiteUrl: this.client.websiteUrl || "",
        status: this.client.status || DefaultStatus.ACTIVE,
        ownerFirstName:
          this.client.owner?.firstName ||
          this.client.owner?.name?.split(" ")[0] ||
          "",
        ownerLastName:
          this.client.owner?.lastName ||
          this.client.owner?.name?.split(" ").slice(1).join(" ") ||
          "",
        ownerEmail: this.client.owner?.email || "",
        ownerPhone: this.client.owner?.phone || "",
        contactEmail:
          this.client.contact?.email || this.client.owner?.email || "",
        contactPhone:
          this.client.contact?.phone || this.client.owner?.phone || "",
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
            street: [
              addr.street || "",
              [Validators.required, Validators.maxLength(100)],
            ],
            zipCode: [addr.zipCode || "", Validators.required],
            city: [
              addr.city || "",
              [Validators.required, Validators.maxLength(50)],
            ],
            state: [
              addr.state || "",
              [
                Validators.required,
                Validators.maxLength(2),
                Validators.minLength(2),
              ],
            ],
            country: [
              addr.country || "",
              [Validators.required, Validators.maxLength(100)],
            ],
            complement: [addr.complement || "", Validators.maxLength(100)],
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
        street: ["", [Validators.required, Validators.maxLength(100)]],
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
        country: ["US", [Validators.required, Validators.maxLength(100)]],
        complement: ["", Validators.maxLength(100)],
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
          console.error("Error fetching ZIP code data:", error);
        },
      });
    }
  }

  onSubmit(): void {
    if (this.editForm.valid && this.addressesFormArray.length > 0) {
      this.loading = true;
      const formValue = this.editForm.value;
      const addressesDTO: AddressRequestDTO[] = formValue.addresses.map(
        (addr: any) => ({
          street: addr.street,
          zipCode: addr.zipCode,
          city: addr.city,
          state: addr.state,
          country: addr.country,
          complement: addr.complement,
        })
      );
      const clientRequest: ClientRequestDTO = {
        businessName: formValue.businessName,
        identificationNumber: formValue.identificationNumber,
        industry: formValue.industry,
        websiteUrl: formValue.websiteUrl,
        status: formValue.status,
        contact: {
          email: formValue.contactEmail,
          phone: formValue.contactPhone,
        },
        owner: {
          identificationNumber: formValue.identificationNumber,
          firstName: formValue.ownerFirstName,
          lastName: formValue.ownerLastName,
          email: formValue.ownerEmail,
          phone: formValue.ownerPhone,
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
          console.error("Error updating client:", error);
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
