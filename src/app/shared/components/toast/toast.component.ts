import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { PrimengModule } from '@app/shared/primeng/primeng.module';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule, PrimengModule],
  templateUrl: './toast.component.html'
})
export class ToastComponent {}
