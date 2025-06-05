import { ChangeDetectorRef, Component, AfterViewInit, OnDestroy } from '@angular/core';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { CommonModule } from '@angular/common';
import { IConfigDialogo } from '@app/shared/interfaces/dialog-config.interface';
import { IconSairComponent } from "../../icons/atencao.icon";
import { PrimengModule } from '@app/shared/primeng/primeng.module';
import { LoadingService } from '@app/core/service/loading.service';

@Component({
  standalone: true,
  templateUrl: './dialogo.component.html',
  styleUrls: ['./dialogo.component.scss'],
  imports: [CommonModule,
    PrimengModule, IconSairComponent]
})
export class DialogoComponent implements AfterViewInit, OnDestroy {
  data: IConfigDialogo = {
    titulo: 'Alert!',
    descricao: '',
    icon: 'report',
    acaoPrimaria: ''
  };

  exibir = false;

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
      this.data.descricao = this.data.descricao.replace(/<s>/g, '<span class="font-semibold">').replace(/<\/s>/g, '</span>');
    }

    this.cdr.detectChanges();

    if (!document.querySelector('.sidebar-carrinho')) {
      document.body.style.overflow = 'hidden';
    }
  }

  ngOnChanges() {
    console.log('change');
  }

  ngOnDestroy() {
    this.exibir = false;
    this.cdr.detectChanges();

    if (!document.querySelector('.sidebar-carrinho')) {
      document.body.style.overflow = 'auto';
    }
  }
}
