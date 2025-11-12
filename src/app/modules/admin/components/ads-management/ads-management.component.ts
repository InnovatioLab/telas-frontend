import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { ClientService } from "@app/core/service/api/client.service";
import { ToastService } from "@app/core/service/state/toast.service";
import { AdValidationType, Role } from "@app/model/client";
import { PendingAdAdminValidationResponseDto } from "@app/model/dto/response/ad-request-response.dto";
import { ErrorComponent } from "@app/shared";
import { IconsModule } from "@app/shared/icons/icons.module";
import { PrimengModule } from "@app/shared/primeng/primeng.module";
import { MessageService } from "primeng/api";

@Component({
  selector: "app-ads-management",
  standalone: true,
  imports: [
    CommonModule,
    PrimengModule,
    FormsModule,
    ReactiveFormsModule,
    ErrorComponent,
    IconsModule,
  ],
  templateUrl: "./ads-management.component.html",
  styleUrls: ["./ads-management.component.scss"],
})
export class AdsManagementComponent implements OnInit {
  pendingAds: PendingAdAdminValidationResponseDto[] = [];
  loading = false;
  searchTerm = "";
  totalRecords = 0;
  currentPage = 1;
  pageSize = 10;

  // Validation dialog states
  showValidateDialog = false;
  selectedAd: PendingAdAdminValidationResponseDto | null = null;
  loadingValidation = false;

  // Validation form
  validateForm: FormGroup;
  validationOptions = [
    { label: "Approve", value: AdValidationType.APPROVED },
    { label: "Reject", value: AdValidationType.REJECTED },
  ];

  constructor(
    private readonly clientService: ClientService,
    private readonly toastService: ToastService,
    private readonly messageService: MessageService,
    private readonly fb: FormBuilder
  ) {
    this.validateForm = this.fb.group({
      validation: ["", Validators.required],
      justification: [""],
      description: [""],
    });
  }

  ngOnInit(): void {
    this.loadPendingAds();
  }

  loadPendingAds(): void {
    this.loading = true;

    const filters = {
      page: this.currentPage,
      size: this.pageSize,
      genericFilter: this.searchTerm,
    };

    this.clientService.getPendingAds(filters).subscribe({
      next: (response) => {
        this.pendingAds = response.list || [];
        this.totalRecords = response.totalElements || 0;
        this.loading = false;
      },
      error: (error) => {
        
        this.toastService.erro("Failed to load pending ads");
        this.loading = false;
      },
    });
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadPendingAds();
  }

  onPageChange(event: any): void {
    this.currentPage = event.page + 1;
    this.pageSize = event.rows;
    this.loadPendingAds();
  }

  openValidateDialog(ad: PendingAdAdminValidationResponseDto): void {
    this.selectedAd = ad;
    this.validateForm.reset();
    this.showValidateDialog = true;
  }

  closeValidateDialog(): void {
    this.showValidateDialog = false;
    this.selectedAd = null;
    this.validateForm.reset();
  }

  onValidationChange(event: any): void {
    const validation = event.value;

    if (validation === AdValidationType.REJECTED) {
      this.validateForm
        .get("justification")
        ?.setValidators([Validators.required]);
      this.validateForm.get("justification")?.updateValueAndValidity();
    } else {
      this.validateForm.get("justification")?.clearValidators();
      this.validateForm.get("justification")?.updateValueAndValidity();
    }
  }

  submitValidation(): void {
    if (this.validateForm.invalid || !this.selectedAd) {
      return;
    }

    this.loadingValidation = true;

    const formValue = this.validateForm.value;
    const refusedData =
      formValue.validation === AdValidationType.REJECTED
        ? {
            justification: formValue.justification,
            description: formValue.description,
          }
        : undefined;

    this.clientService
      .validateAd(this.selectedAd.id, formValue.validation, refusedData)
      .subscribe({
        next: () => {
          this.toastService.sucesso("Ad validation submitted successfully");
          this.closeValidateDialog();
          this.loadPendingAds(); // Recarregar dados
          this.loadingValidation = false;
        },
        error: (error) => {
          
          this.toastService.erro("Failed to validate ad");
          this.loadingValidation = false;
        },
      });
  }

  getStatusSeverity(
    validation: string
  ): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" {
    switch (validation?.toLowerCase()) {
      case "approved":
        return "success";
      case "pending":
        return "warn";
      case "rejected":
        return "danger";
      default:
        return "info";
    }
  }

  getStatusLabel(validation: string): string {
    switch (validation?.toLowerCase()) {
      case "approved":
        return "Approved";
      case "pending":
        return "Pending";
      case "rejected":
        return "Rejected";
      default:
        return "Unknown";
    }
  }

  getPartnerStatusSeverity(
    role: string
  ): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" {
    return role === Role.PARTNER ? "success" : "info";
  }

  getPartnerStatusLabel(role: string): string {
    return role === Role.PARTNER ? "Partner" : "Client";
  }

  getRoleLabel(role: string): string {
    switch (role?.toLowerCase()) {
      case "admin":
        return "Administrator";
      case "client":
        return "Client";
      case "partner":
        return "Partner";
      default:
        return role || "Unknown";
    }
  }

  mostrarErro(form: FormGroup, campo: string): boolean {
    return form.get(campo)?.invalid && form.get(campo)?.touched;
  }

  viewAd(link: string): void {
    window.open(link, "_blank");
  }
}
