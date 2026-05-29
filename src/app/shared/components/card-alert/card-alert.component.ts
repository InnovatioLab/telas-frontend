import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimengModule } from '@app/shared/primeng/primeng.module';
import { DialogService } from 'primeng/dynamicdialog';
import { AcknowledgeDialogComponent } from '../acknowledge-dialog/acknowledge-dialog.component';
import { IMonitorAlert } from '@app/core/service/api/interfaces/monitor';
import { DateFormatter } from '@app/shared/utils/date-formatter.utils';

@Component({
  selector: 'app-card-alert',
  standalone: true,
  imports: [CommonModule, PrimengModule],
  templateUrl: './card-alert.component.html',
  styleUrls: ['./card-alert.component.scss'],
  providers: [DialogService]
})
export class CardAlertComponent {
  @Input() alert: IMonitorAlert;
  @Output() resolve = new EventEmitter<IMonitorAlert>();
  @Output() acknowledge = new EventEmitter<{ alert: IMonitorAlert, reason: string }>();

  constructor(private readonly dialogService: DialogService) {}

  getStatusClass(status: string): string {
    return `status-${status}`;
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'critical': return 'Critical';
      case 'warning': return 'Warning';
      case 'resolved': return 'Resolved';
      case 'acknowledged': return 'Acknowledged';
      default: return status;
    }
  }

  formatTimestamp(timestamp: Date): string {
    if (!timestamp) return '';
    return DateFormatter.formatDateTime(timestamp);
  }

  onResolve(event: Event): void {
    event.stopPropagation();
    this.resolve.emit(this.alert);
  }

  onAcknowledge(event: Event): void {
    event.stopPropagation();
    
    const ref = this.dialogService.open(AcknowledgeDialogComponent, {
      header: 'Acknowledge Alert',
      width: '500px',
      data: {
        alertTitle: this.alert.title,
        deviceId: this.alert.deviceId
      }
    });

    ref.onClose.subscribe((reason: string) => {
      if (reason) {
        this.acknowledge.emit({ alert: this.alert, reason });
      }
    });
  }
}
