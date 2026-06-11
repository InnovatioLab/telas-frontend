import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { ClientService } from "@app/core/service/api/client.service";
import { NotificationsService } from "@app/core/service/api/notifications.service";
import { ToastService } from "@app/core/service/state/toast.service";
import { RefusedAdRequestDto } from "@app/model/dto/request/refused-ad-request.dto";
import { AdResponseDto } from "@app/model/dto/response/ad-response.dto";
import { PendingAdAdminValidationResponseDto } from "@app/model/dto/response/ad-request-response.dto";
import { ErrorComponent } from "@app/shared/components";
import { PrimengModule } from "@app/shared/primeng/primeng.module";
import { AdItemComponent } from "../ad-item/ad-item.component";
import {
  AD_APPROVED_SUCCESS_TOAST,
  AD_REJECTED_SENT_BACK_TO_ADMIN_TOAST,
} from "@app/shared/constants/ad-validation-toast.constants";

@Component({
  selector: "app-partner-pending-ads",
  standalone: true,
  imports: [
    CommonModule,
    PrimengModule,
    ReactiveFormsModule,
    AdItemComponent,
    ErrorComponent,
  ],
  templateUrl: "./partner-pending-ads.component.html",
  styleUrls: ["./partner-pending-ads.component.scss"],
})
export class PartnerPendingAdsComponent implements OnInit {
  ads: AdResponseDto[] = [];
  loading = false;
  showRejectDialog = false;
  selectedAd: AdResponseDto | null = null;
  rejectForm: FormGroup;
  submitting = false;

  constructor(
    private readonly clientService: ClientService,
    private readonly toastService: ToastService,
    private readonly notificationsService: NotificationsService,
    private readonly fb: FormBuilder
  ) {
    this.rejectForm = this.fb.group({
      justification: ["", [Validators.required, Validators.maxLength(100)]],
      description: ["", [Validators.maxLength(255)]],
    });
  }

  ngOnInit(): void {
    this.loadAds();
  }

  loadAds(): void {
    this.loading = true;
    this.clientService.getPartnerPendingAds().subscribe({
      next: (list) => {
        this.ads = (list ?? []).map((item) => this.toAdResponse(item));
        this.loading = false;
      },
      error: () => {
        this.toastService.error("Failed to load ads for review");
        this.loading = false;
      },
    });
  }

  private toAdResponse(item: PendingAdAdminValidationResponseDto): AdResponseDto {
    return {
      id: item.id,
      name: item.name,
      submissionDate: item.submissionDate,
      link: item.link,
      validation: item.validation,
      waitingDays: item.waitingDays,
      refusedCount: 0,
    };
  }

  approveAd(ad: AdResponseDto): void {
    if (!ad?.id) {
      return;
    }
    this.submitting = true;
    this.clientService.validateAd(ad.id, "APPROVED").subscribe({
      next: () => {
        this.submitting = false;
        this.toastService.success(AD_APPROVED_SUCCESS_TOAST);
        this.notificationsService
          .refreshAndMarkReferencesAsRead([
            "AD_RECEIVED",
            "AD_RESUBMITTED_FOR_VALIDATION",
          ])
          .subscribe();
        this.loadAds();
      },
      error: () => {
        this.submitting = false;
        this.toastService.error("Failed to approve ad");
      },
    });
  }

  openRejectDialog(ad: AdResponseDto): void {
    this.selectedAd = ad;
    this.rejectForm.reset();
    this.showRejectDialog = true;
  }

  closeRejectDialog(): void {
    this.showRejectDialog = false;
    this.selectedAd = null;
    this.rejectForm.reset();
  }

  submitReject(): void {
    if (!this.selectedAd?.id || this.rejectForm.invalid) {
      this.rejectForm.markAllAsTouched();
      return;
    }
    const msg = String(this.rejectForm.get("justification")?.value ?? "").trim();
    const desc = String(this.rejectForm.get("description")?.value ?? "").trim();
    const full = [msg, desc].filter(Boolean).join("\n");
    const refusedData: RefusedAdRequestDto = {
      justification: full.slice(0, 100),
      description: full.length > 100 ? full : undefined,
    };
    this.submitting = true;
    this.clientService
      .validateAd(this.selectedAd.id, "REJECTED", refusedData)
      .subscribe({
        next: () => {
          this.submitting = false;
          this.toastService.warn(AD_REJECTED_SENT_BACK_TO_ADMIN_TOAST);
          this.closeRejectDialog();
          this.loadAds();
        },
        error: () => {
          this.submitting = false;
          this.toastService.error("Failed to reject ad");
        },
      });
  }

  showFieldError(controlName: string): boolean {
    const control = this.rejectForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}
