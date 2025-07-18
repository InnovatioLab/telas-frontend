import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PrimengModule } from '@app/shared/primeng/primeng.module';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';

@Component({
  selector: 'app-acknowledge-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, PrimengModule],
  templateUrl: './acknowledge-dialog.component.html',
  styleUrls: ['./acknowledge-dialog.component.scss']
})
export class AcknowledgeDialogComponent implements OnInit {
  reason: string = '';
  data: { alertTitle: string; deviceId: string };

  constructor(
    public ref: DynamicDialogRef,
    public config: DynamicDialogConfig
  ) {}

  ngOnInit() {
    this.data = this.config.data;
  }

  confirm() {
    this.ref.close(this.reason);
  }

  cancel() {
    this.ref.close();
  }
}
