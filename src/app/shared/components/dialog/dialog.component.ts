import { CommonModule } from "@angular/common";
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  OnInit,
  OnDestroy,
  Output,
  SecurityContext,
} from "@angular/core";
import { LoadingService } from "@app/core/service/state/loading.service";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { IDialogConfig } from "@app/shared/interfaces/dialog-config.interface";
import { PrimengModule } from "@app/shared/primeng/primeng.module";
import { DynamicDialogConfig, DynamicDialogRef } from "primeng/dynamicdialog";
import { IconAtencaoComponent } from "../../icons/atencao.icon";

@Component({
  standalone: true,
  templateUrl: "./dialog.component.html",
  styleUrls: ["./dialog.component.scss"],
  imports: [CommonModule, PrimengModule, IconAtencaoComponent],
})
export class DialogComponent implements OnInit, AfterViewInit, OnDestroy {
  @Output() onChange = new EventEmitter<any>();

  data: IDialogConfig = {
    title: "Alert!",
    description: "",
    icon: "report",
    primaryAction: "",
  };

  show = false;
  value: any;
  safeDescription: SafeHtml = "";

  get iconComponent() {
    return typeof this.data.icon === "function" ? this.data.icon : null;
  }

  constructor(
    public ref: DynamicDialogRef,
    public config: DynamicDialogConfig,
    private readonly cdr: ChangeDetectorRef,
    private readonly loadingService: LoadingService,
    private readonly sanitizer: DomSanitizer
  ) {
    this.config.showHeader = false;
    this.data = this.config.data;
  }

  ngOnInit() {
    let description = this.data.description ?? "";
    if (description) {
      description = description
        .replace(/<s>/g, '<span class="font-semibold">')
        .replace(/<\/s>/g, "</span>");
    }
    // description may contain user-provided data interpolated into HTML —
    // sanitize before using [innerHTML] to strip scripts/event handlers while
    // preserving expected formatting (<span>, <strong>, etc).
    const sanitized = this.sanitizer.sanitize(SecurityContext.HTML, description);
    this.safeDescription = this.sanitizer.bypassSecurityTrustHtml(sanitized ?? "");
    this.show = true;
    this.cdr.markForCheck();
  }

  ngAfterViewInit() {
    this.cdr.detectChanges();

    if (!document.querySelector(".sidebar-carrinho")) {
      document.body.style.overflow = "hidden";
    }

    setTimeout(() => {
      this.cdr.detectChanges();
    }, 0);
  }

  ngOnChanges() {}

  ngOnDestroy() {
    this.show = false;
    this.cdr.detectChanges();

    if (!document.querySelector(".sidebar-carrinho")) {
      document.body.style.overflow = "auto";
    }
  }

  change() {
    this.onChange.emit(this.value);
  }
}
