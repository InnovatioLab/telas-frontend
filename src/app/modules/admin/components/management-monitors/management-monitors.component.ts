import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimengModule } from '@app/shared/primeng/primeng.module';
import { FormsModule } from '@angular/forms';
import { IconsModule } from '@app/shared/icons/icons.module';
import { MonitorService } from '@app/core/service/api/monitor.service';
import { ToastService } from '@app/core/service/state/toast.service';
import { Monitor, MonitorType } from '@app/model/monitors';
import { DefaultStatus } from '@app/model/client';
import { CreateMonitorRequestDto } from '@app/model/dto/request/create-monitor.request.dto';
import { CreateMonitorModalComponent } from '../create-monitor-modal/create-monitor-modal.component';

@Component({
  selector: 'app-management-monitors',
  standalone: true,
  imports: [
    CommonModule,
    PrimengModule,
    FormsModule,
    IconsModule,
    CreateMonitorModalComponent
  ],
  templateUrl: './management-monitors.component.html',
  styleUrls: ['./management-monitors.component.scss']
})
export class ManagementMonitorsComponent implements OnInit {
  monitors: Monitor[] = [];
  selectedMonitor: Monitor | null = null;
  loading = false;
  dialogVisible = false;
  createMonitorModalVisible = false;

  constructor(
    private readonly monitorService: MonitorService,
    private readonly toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadMonitors();
  }

  loadMonitors(): void {
    this.loading = true;
    this.monitorService.getMonitors().subscribe(
      (data) => {
        this.monitors = data;
        this.loading = false;
      },
      (error) => {
        this.toastService.erro('Error loading monitors');
        this.loading = false;
      }
    );
  }

  openCreateMonitorModal(): void {
    this.createMonitorModalVisible = true;
  }

  onMonitorCreated(monitorRequest: CreateMonitorRequestDto): void {
    this.loading = true;
    
    this.monitorService.createMonitor(monitorRequest).subscribe({
      next: (newMonitor) => {
        this.monitors.push(newMonitor);
        this.toastService.sucesso('Monitor created successfully');
        this.createMonitorModalVisible = false;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error creating monitor:', error);
        this.toastService.erro('Error creating monitor');
        this.loading = false;
      }
    });
  }

  onCreateMonitorModalClose(): void {
    this.createMonitorModalVisible = false;
  }

  onSelectMonitor(monitor: Monitor): void {
    this.selectedMonitor = { ...monitor };
    this.dialogVisible = true;
  }

  updateMonitor(monitor: Monitor): void {
    if (!monitor) return;
    
    this.loading = true;
    
    if (monitor.id) {
      this.monitorService.updateMonitor(monitor.id, monitor).subscribe(
        (updatedMonitor) => {
          const index = this.monitors.findIndex(m => m.id === updatedMonitor.id);
          if (index !== -1) {
            this.monitors[index] = updatedMonitor;
          }
          this.toastService.sucesso('Monitor updated successfully');
          this.dialogVisible = false;
          this.selectedMonitor = null;
          this.loading = false;
        },
        (error) => {
          this.toastService.erro('Error updating monitor');
          this.loading = false;
        }
      );
    }
  }

  deleteMonitor(id: string): void {
    if (confirm('Are you sure you want to delete this monitor?')) {
      this.loading = true;
      this.monitorService.deleteMonitor(id).subscribe(
        (success) => {
          if (success) {
            this.monitors = this.monitors.filter(m => m.id !== id);
            this.toastService.sucesso('Monitor deleted successfully');
          } else {
            this.toastService.erro('Error deleting monitor');
          }
          this.loading = false;
        },
        (error) => {
          this.toastService.erro('Error deleting monitor');
          this.loading = false;
        }
      );
    }
  }
}
