import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { CommonModule } from '@angular/common';
import { ToastComponent } from './shared/components/toast/toast.component';
import packageJson from '../../package.json';
import { DotsLoadingComponent } from "./shared/components/dots-loading/dots-loading.component";
import { PrimengModule } from './shared/primeng/primeng.module';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';

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
