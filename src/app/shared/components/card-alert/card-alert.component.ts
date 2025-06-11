import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimengModule } from '@app/shared/primeng/primeng.module';
import { DialogService } from 'primeng/dynamicdialog';
import { AcknowledgeDialogComponent } from '../acknowledge-dialog/acknowledge-dialog.component';
import { IMonitorAlert } from '@app/core/service/api/interfaces/monitor';

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
    
    const now = new Date();
    const alertTime = new Date(timestamp);
    const diffMs = now.getTime() - alertTime.getTime();
    const diffMins = Math.round(diffMs / 60000);
    
    if (diffMins < 60) {
      return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffMins < 1440) { // less than 24 hours
      const hours = Math.floor(diffMins / 60);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffMins / 1440);
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    }
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
