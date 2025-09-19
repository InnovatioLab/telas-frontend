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
    this.ngZone.runOutsideAngular(() => {
      const host = this.hostRef.nativeElement;
      const header = host.querySelector(".ad-header") as HTMLElement | null;
      
      if (host) {
        this.renderer.setStyle(host, "position", "relative");
      }
      
      if (header) {
        // Forçar estilos críticos via Renderer2
        this.renderer.setStyle(header, "display", "flex");
        this.renderer.setStyle(header, "visibility", "visible");
        this.renderer.setStyle(header, "opacity", "1");
        this.renderer.setStyle(header, "position", "relative");
        this.renderer.setStyle(header, "z-index", "10");
        this.renderer.setStyle(header, "min-height", "60px");
        this.renderer.setStyle(header, "width", "100%");
        this.renderer.setStyle(header, "margin-bottom", "1rem");
        this.renderer.setStyle(header, "background", "rgba(255, 255, 0, 0.2)"); // debug temporário
        
        // Garantir que os filhos também sejam visíveis
        const children = header.querySelectorAll("*");
        children.forEach((child: HTMLElement) => {
          this.renderer.setStyle(child, "visibility", "visible");
          this.renderer.setStyle(child, "opacity", "1");
        });
      }
      
      // Reforçar após um delay para garantir que estilos externos não sobrescrevam
      setTimeout(() => {
        if (header) {
          this.renderer.setStyle(header, "display", "flex");
          this.renderer.setStyle(header, "visibility", "visible");
          this.renderer.setStyle(header, "opacity", "1");
          this.renderer.setStyle(header, "z-index", "10");
        }
      }, 100);
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


