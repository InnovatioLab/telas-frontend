import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ToastModule } from 'primeng/toast';
import packageJson from '../../package.json';
import { DotsLoadingComponent } from "./shared/components/dots-loading/dots-loading.component";
import { ToastComponent } from './shared/components/toast/toast.component';
import { PrimengModule } from './shared/primeng/primeng.module';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, PrimengModule, RouterModule, ToastModule, ConfirmDialogModule, ToastComponent, DotsLoadingComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'Telas';
  public version: string = packageJson.version;
  ref: DynamicDialogRef | undefined;

  constructor(
    private readonly router: Router,
    public dialogService: DialogService,
  ) {
  }

}
