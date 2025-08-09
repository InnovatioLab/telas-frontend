import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ToastModule } from 'primeng/toast';
import { PrimengModule } from '@app/shared/primeng/primeng.module';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule, PrimengModule, ToastModule],
  templateUrl: './toast.component.html'
})
export class ToastComponent {}
