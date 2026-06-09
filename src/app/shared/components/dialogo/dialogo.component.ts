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
import { IConfigDialogo } from "@app/shared/interfaces/dialog-config.interface";
import { PrimengModule } from "@app/shared/primeng/primeng.module";
import { DynamicDialogConfig, DynamicDialogRef } from "primeng/dynamicdialog";
import { IconAtencaoComponent } from "../../icons/atencao.icon";

@Component({
  standalone: true,
  templateUrl: "./dialogo.component.html",
  styleUrls: ["./dialogo.component.scss"],
  imports: [CommonModule, PrimengModule, IconAtencaoComponent],
})
export class DialogoComponent implements OnInit, AfterViewInit, OnDestroy {
  @Output() onChange = new EventEmitter<any>();

  data: IConfigDialogo = {
    titulo: "Alert!",
    descricao: "",
    icon: "report",
    acaoPrimaria: "",
  };

  exibir = false;
  value: any;
  safeDescricao: SafeHtml = "";

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
    let descricao = this.data.descricao ?? "";
    if (descricao) {
      descricao = descricao
        .replace(/<s>/g, '<span class="font-semibold">')
        .replace(/<\/s>/g, "</span>");
    }
    // descricao pode conter dados informados por usuários interpolados em HTML —
    // sanitizamos antes de usar [innerHTML] para remover scripts/handlers de
    // evento mantendo a formatação esperada (<span>, <strong>, etc).
    const sanitized = this.sanitizer.sanitize(SecurityContext.HTML, descricao);
    this.safeDescricao = this.sanitizer.bypassSecurityTrustHtml(sanitized ?? "");
    this.exibir = true;
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
    this.exibir = false;
    this.cdr.detectChanges();

    if (!document.querySelector(".sidebar-carrinho")) {
      document.body.style.overflow = "auto";
    }
  }

  change() {
    this.onChange.emit(this.value);
  }
}
