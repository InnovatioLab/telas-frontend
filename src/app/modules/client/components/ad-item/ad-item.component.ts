import { CommonModule, NgOptimizedImage } from "@angular/common";
import { Component, EventEmitter, Input, Output } from "@angular/core";
import { PrimengModule } from "@app/shared/primeng/primeng.module";
import { AdValidationType } from "@app/model/client";
import { AdResponseDto } from "@app/model/dto/response/ad-response.dto";

@Component({
  selector: "app-ad-item",
  standalone: true,
  imports: [CommonModule, PrimengModule, NgOptimizedImage],
  templateUrl: "./ad-item.component.html",
  styleUrls: ["./ad-item.component.scss"],
})
export class AdItemComponent {
  @Input() ad!: AdResponseDto;
  @Input() loading = false;

  @Output() view = new EventEmitter<string>();
  @Output() download = new EventEmitter<string>();
  @Output() validate = new EventEmitter<AdResponseDto>();

  onView(): void {
    if (this.ad?.link) {
      this.view.emit(this.ad.link);
    }
  }

  onDownload(): void {
    if (this.ad?.link) {
      this.download.emit(this.ad.link);
    }
  }

  onValidate(): void {
    if (this.ad) {
      this.validate.emit(this.ad);
    }
  }

  getValidationBadgeClass(validation: AdValidationType): string {
    switch (validation) {
      case AdValidationType.PENDING:
        return "badge-warning";
      case AdValidationType.APPROVED:
        return "badge-success";
      case AdValidationType.REJECTED:
        return "badge-danger";
      default:
        return "badge-secondary";
    }
  }

  getValidationLabel(validation: AdValidationType): string {
    switch (validation) {
      case AdValidationType.PENDING:
        return "Pending";
      case AdValidationType.APPROVED:
        return "Approved";
      case AdValidationType.REJECTED:
        return "Rejected";
      default:
        return "Unknown";
    }
  }

  canValidateAd(): boolean {
    return this.ad?.validation === "PENDING" && this.ad?.canBeValidatedByOwner;
  }
}


