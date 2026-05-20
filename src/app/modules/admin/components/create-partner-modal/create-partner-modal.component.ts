import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { TextOnlyDirective } from "@app/core/directives/text-only.directive";
import { ReservedBusinessNameDirective } from "@app/core/directives/reserved-business-name.directive";
import { ClientManagementService } from "@app/core/service/api/client-management.service";
import { ZipCodeService } from "@app/core/service/api/zipcode.service";
import { ToastService } from "@app/core/service/state/toast.service";
import { SenhaDirective } from "@app/core/directives/senha.directive";
import { AddressRequestDTO } from "@app/model/dto/request/client-request.dto";
import { CreatePartnerRequestDTO } from "@app/model/dto/request/create-partner-request.dto";
import { ErrorComponent } from "@app/shared";
import { IconCheckComponent } from "@app/shared/icons/check.icon";
import { IconsModule } from "@app/shared/icons/icons.module";
import { PrimengModule } from "@app/shared/primeng/primeng.module";
import { AbstractControlUtils } from "@app/shared/utils/abstract-control.utils";
import { ButtonModule } from "primeng/button";
import { DynamicDialogRef } from "primeng/dynamicdialog";
import { InputTextModule } from "primeng/inputtext";

@Component({
  selector: "app-create-partner-modal",
  standalone: true,
  imports: [
    CommonModule,
    ErrorComponent,
    PrimengModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    IconCheckComponent,
    IconsModule,
    TextOnlyDirective,
    ReservedBusinessNameDirective,
    SenhaDirective,
  ],
  templateUrl: "./create-partner-modal.component.html",
  styleUrls: ["./create-partner-modal.component.scss"],
})
export class CreatePartnerModalComponent implements OnInit {
  form: FormGroup;
  loading = false;

  get addressesFormArray(): FormArray {
    return this.form.get("addresses") as FormArray;
  }

  constructor(
    private readonly fb: FormBuilder,
    private readonly clientManagementService: ClientManagementService,
    private readonly toastService: ToastService,
    private readonly zipCodeService: ZipCodeService,
    public readonly ref: DynamicDialogRef
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      businessName: ["", [Validators.required, Validators.maxLength(255)]],
      industry: ["", [Validators.maxLength(50)]],
      websiteUrl: [
        "",
        [Validators.maxLength(255), AbstractControlUtils.validateUrl()],
      ],
      contactEmail: [
        "",
        [Validators.required, Validators.email, Validators.maxLength(255)],
      ],
      contactPhone: [
        "",
        [Validators.required, AbstractControlUtils.validatePhone()],
      ],
      addresses: this.fb.array([this.buildAddressGroup()]),
      password: [
        "",
        [
          Validators.required,
          Validators.minLength(8),
          Validators.maxLength(32),
        ],
      ],
      confirmPassword: ["", [Validators.required]],
    });
  }

  passwordsMatch(): boolean {
    const password = this.form.get("password")?.value;
    const confirmPassword = this.form.get("confirmPassword")?.value;
    return password === confirmPassword;
  }

  private buildAddressGroup(): FormGroup {
    return this.fb.group({
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
      country: ["US", [Validators.required, Validators.maxLength(100)]],
      address2: ["", Validators.maxLength(100)],
    });
  }

  getAddressGroup(index: number): FormGroup {
    return this.addressesFormArray.at(index) as FormGroup;
  }

  onZipCodeChange(addressGroup: FormGroup, zipCode: string): void {
    if (zipCode && zipCode.length >= 5) {
      this.zipCodeService.findLocationByZipCode(zipCode).subscribe({
        next: (addressData) => {
          if (addressData) {
            addressGroup.patchValue({
              city: addressData.city || "",
              state: addressData.state || "",
              country: addressData.country || "US",
            });
          }
        },
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (!this.passwordsMatch()) {
      this.toastService.erro("Passwords do not match");
      return;
    }

    this.loading = true;
    const formValue = this.form.getRawValue();
    const addressesDTO: AddressRequestDTO[] = formValue.addresses.map(
      (addr: AddressRequestDTO & { address2?: string | null }) => ({
        street: addr.street,
        zipCode: addr.zipCode,
        city: addr.city,
        state: addr.state,
        country: addr.country,
        address2: addr.address2 ?? undefined,
      })
    );

    const normalizePhone = (value: string): string =>
      (value || "").replace(/\D/g, "");

    const payload: CreatePartnerRequestDTO = {
      businessName: formValue.businessName,
      industry: formValue.industry || undefined,
      websiteUrl: formValue.websiteUrl || undefined,
      contact: {
        email: formValue.contactEmail.trim(),
        phone: normalizePhone(formValue.contactPhone),
      },
      addresses: addressesDTO,
      password: formValue.password,
      confirmPassword: formValue.confirmPassword,
    };

    this.clientManagementService.createPartner(payload).subscribe({
      next: () => {
        this.toastService.sucesso(
          "Partner created successfully. They can sign in with the email and password you set."
        );
        this.ref.close({ success: true });
        this.loading = false;
      },
      error: () => {
        this.toastService.erro("Failed to create partner");
        this.loading = false;
      },
    });
  }

  onCancel(): void {
    this.ref.close({ success: false });
  }
}
