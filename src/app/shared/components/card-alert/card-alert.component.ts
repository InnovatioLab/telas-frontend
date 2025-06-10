import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PrimengModule } from '@app/shared/primeng/primeng.module';
import { IconsModule } from '@app/shared/icons/icons.module';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { AcknowledgeDialogComponent } from '../acknowledge-dialog/acknowledge-dialog.component';

export interface Alert {
  id: string;
  title: string;
  description: string;
  timestamp: Date;
  status: 'critical' | 'warning' | 'resolved' | 'acknowledged';
  deviceId: string;
  acknowledgeReason?: string;
}

@Component({
  selector: 'app-card-alert',
  standalone: true,
  imports: [CommonModule, FormsModule, PrimengModule, IconsModule],
  templateUrl: './card-alert.component.html',
  styleUrls: ['./card-alert.component.scss']
})
export class CardAlertComponent {
  @Input() alert: Alert;
  @Output() resolve = new EventEmitter<Alert>();
  @Output() acknowledge = new EventEmitter<{alert: Alert, reason: string}>();
  
  private dialogRef: DynamicDialogRef;
  
  constructor(private dialogService: DialogService) {}
  
  get statusLabel(): string {
    switch (this.alert.status) {
      case 'critical': return 'Critical';
      case 'warning': return 'Warning';
      case 'resolved': return 'Resolved';
      case 'acknowledged': return 'Acknowledged';
      default: return '';
    }
  }
  
  get statusClass(): string {
    switch (this.alert.status) {
      case 'critical': return 'alert-critical';
      case 'warning': return 'alert-warning';
      case 'resolved': return 'alert-resolved';
      case 'acknowledged': return 'alert-acknowledged';
      default: return '';
    }
  }
  
  get canBeAcknowledged(): boolean {
    return this.alert.status !== 'resolved' && this.alert.status !== 'acknowledged';
  }
  
  get canBeResolved(): boolean {
    return this.alert.status !== 'resolved';
  }
  
  get acknowledgeTooltip(): string {
    return this.alert.acknowledgeReason
      ? `Acknowledged: ${this.alert.acknowledgeReason}`
      : 'Acknowledge this alert';
  }
  
  formatTimestamp(date: Date): string {
    return new Date(date).toLocaleString();
  }
  
  onResolve(): void {
    this.resolve.emit(this.alert);
  }
  
  onAcknowledge(): void {
    this.openAcknowledgeDialog();
  }
  
  private openAcknowledgeDialog(): void {
    this.dialogRef = this.dialogService.open(AcknowledgeDialogComponent, {
      header: 'Acknowledge Alert',
      width: '500px',
      contentStyle: { padding: '1rem', overflow: 'auto' },
      baseZIndex: 10000,
      data: {
        alertTitle: this.alert.title,
        deviceId: this.alert.deviceId
      }
    });
    
    this.dialogRef.onClose.subscribe((reason: string) => {
      if (reason) {
        this.acknowledge.emit({
          alert: this.alert,
          reason: reason
        });
      }
    });
  }
}
