import { CommonModule } from "@angular/common";
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  OnDestroy,
  Output,
} from "@angular/core";
import { LoadingService } from "@app/core/service/state/loading.service";
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
export class DialogoComponent implements AfterViewInit, OnDestroy {
  @Output() onChange = new EventEmitter<any>();

  data: IConfigDialogo = {
    titulo: "Alert!",
    descricao: "",
    icon: "report",
    acaoPrimaria: "",
  };

  exibir = false;
  value: any;

  get iconComponent() {
    return typeof this.data.icon === "function" ? this.data.icon : null;
  }

  constructor(
    public ref: DynamicDialogRef,
    public config: DynamicDialogConfig,
    private readonly cdr: ChangeDetectorRef,
    private readonly loadingService: LoadingService
  ) {
    this.config.showHeader = false;
    this.data = this.config.data;
  }

  ngAfterViewInit() {
    this.exibir = true;

    if (this.data.descricao) {
      this.data.descricao = this.data.descricao
        .replace(/<s>/g, '<span class="font-semibold">')
        .replace(/<\/s>/g, "</span>");
    }

    this.cdr.detectChanges();

    if (!document.querySelector(".sidebar-carrinho")) {
      document.body.style.overflow = "hidden";
    }
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
