import { CommonModule, NgOptimizedImage } from "@angular/common";
import { AfterViewInit, Component, ElementRef, EventEmitter, Input, NgZone, OnDestroy, Output, Renderer2 } from "@angular/core";
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

  ngAfterViewInit(): void {
    this.ngZone.runOutsideAngular(() => {
      const host = this.hostRef.nativeElement;
      const header = host.querySelector(".ad-header") as HTMLElement | null;
      const image = host.querySelector(".ad-content img") as HTMLElement | null;

      // Estilos de reforço imediatos
      if (host) {
        this.renderer.setStyle(host, "position", "relative");
        this.renderer.setStyle(host, "overflow", "visible");
      }
      if (header) {
        this.renderer.setStyle(header, "position", "relative");
        this.renderer.setStyle(header, "z-index", 1002);
        this.renderer.setStyle(header, "visibility", "visible");
        this.renderer.setStyle(header, "opacity", 1);
        this.renderer.setStyle(header, "pointer-events", "auto");
        // Garantir filhos visíveis
        header.querySelectorAll<HTMLElement>("*").forEach((el) => {
          this.renderer.setStyle(el, "visibility", "visible");
          this.renderer.setStyle(el, "opacity", 1);
        });
      }
      if (image) {
        this.renderer.setStyle(image, "position", "relative");
        this.renderer.setStyle(image, "z-index", 1);
        this.renderer.setStyle(image, "pointer-events", "none");
      }

      // Observador para reimpor estilos se algo externo alterar o DOM
      this.mutationObserver = new MutationObserver(() => {
        if (header) {
          this.renderer.setStyle(header, "position", "relative");
          this.renderer.setStyle(header, "z-index", 1002);
          this.renderer.setStyle(header, "visibility", "visible");
          this.renderer.setStyle(header, "opacity", 1);
          this.renderer.setStyle(header, "pointer-events", "auto");
        }
        if (image) {
          this.renderer.setStyle(image, "position", "relative");
          this.renderer.setStyle(image, "z-index", 1);
          this.renderer.setStyle(image, "pointer-events", "none");
        }
      });
      if (host && this.mutationObserver) {
        this.mutationObserver.observe(host, { attributes: true, childList: true, subtree: true });
      }

      // ResizeObserver para evitar altura colapsada
      if (header && "ResizeObserver" in window) {
        this.resizeObserver = new ResizeObserver((entries) => {
          for (const entry of entries) {
            const rect = entry.contentRect;
            if (rect.height < 1) {
              // Forçar altura mínima
              this.renderer.setStyle(header, "min-height", "60px");
            }
          }
        });
        this.resizeObserver.observe(header);
      }

      // Reforçar novamente após um pequeno delay (pós-estilos de libs)
      setTimeout(() => {
        if (header) {
          this.renderer.setStyle(header, "z-index", 1002);
          this.renderer.setStyle(header, "visibility", "visible");
          this.renderer.setStyle(header, "opacity", 1);
        }
      }, 150);
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


