import { CommonModule } from "@angular/common";
import { AfterViewInit, Component, ElementRef, EventEmitter, Input, NgZone, OnDestroy, Output, Renderer2, ViewEncapsulation } from "@angular/core";
import { PrimengModule } from "@app/shared/primeng/primeng.module";
import { AdValidationType } from "@app/model/client";
import { AdResponseDto } from "@app/model/dto/response/ad-response.dto";

@Component({
  selector: "app-ad-item",
  standalone: true,
  imports: [CommonModule, PrimengModule],
  templateUrl: "./ad-item.component.html",
  styleUrls: ["./ad-item.component.scss"],
  encapsulation: ViewEncapsulation.Emulated,
})
export class AdItemComponent implements AfterViewInit, OnDestroy {
  @Input() ad!: AdResponseDto;
  @Input() loading = false;

  @Output() view = new EventEmitter<string>();
  @Output() download = new EventEmitter<string>();
  @Output() validate = new EventEmitter<AdResponseDto>();

  private mutationObserver?: MutationObserver;
  private resizeObserver?: ResizeObserver;

  constructor(
    private readonly hostRef: ElementRef<HTMLElement>,
    private readonly renderer: Renderer2,
    private readonly ngZone: NgZone
  ) {}

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

  onImageLoad(): void {
    // Nada especial necessário agora; mantemos estilo padrão
  }

  onImageError(): void {
    // Em erro, não esconderemos mais a imagem via estilo para não afetar layout
  }

  ngAfterViewInit(): void {
    // Mantemos apenas um ajuste leve para o host
    this.ngZone.runOutsideAngular(() => {
      const host = this.hostRef.nativeElement;
      if (host) {
        this.renderer.setStyle(host, "position", "relative");
      }
    });
  }

  ngOnDestroy(): void {
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }
}


