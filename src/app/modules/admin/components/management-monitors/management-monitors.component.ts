import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimengModule } from '@app/shared/primeng/primeng.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MonitorService } from '@app/core/service/api/monitor.service';
import { ToastService } from '@app/core/service/state/toast.service';
import { Monitor, MonitorType } from '@app/model/monitors';
import { DefaultStatus } from '@app/model/client';
import { CreateMonitorRequestDto, MonitorAdRequestDto } from '@app/model/dto/request/create-monitor.request.dto';
import { DisplayType } from '@app/model/enums/display-type.enum';

@Component({
  selector: 'app-management-monitors',
  standalone: true,
  imports: [
    CommonModule,
    PrimengModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './management-monitors.component.html',
  styleUrls: ['./management-monitors.component.scss']
})
export class ManagementMonitorsComponent implements OnInit {
  monitors: Monitor[] = [];
  selectedMonitor: Monitor | null = null;
  loading = false;
  dialogVisible = false;

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

  createMonitor(): void {
    // Inicializar um novo monitor com valores padrão
    this.selectedMonitor = {
      id: '',
      name: '',
      location: '',
      status: DefaultStatus.ACTIVE,
      lastUpdate: new Date(),
      type: MonitorType.BASIC,
      active: true,
      locationDescription: '',
      size: 42.5,
      productId: '',
      maxBlocks: 12,
      address: {
        id: '',
        street: '',
        city: '',
        state: '',
        country: '',
        zipCode: ''
      }
    };
    this.dialogVisible = true;
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
    } else {
      // Criar um novo monitor usando o DTO correto
      const createMonitorRequest: CreateMonitorRequestDto = {
        productId: monitor.productId || '',
        size: monitor.size || 0,
        address: {
          street: monitor.address?.street || '',
          city: monitor.address?.city || '',
          state: monitor.address?.state || '',
          country: monitor.address?.country || '',
          zipCode: monitor.address?.zipCode || ''
        },
        type: monitor.type || MonitorType.BASIC,
        active: monitor.active !== undefined ? monitor.active : true,
        locationDescription: monitor.locationDescription || '',
        maxBlocks: monitor.maxBlocks || undefined,
        ads: [
          {
            id: new Date().getTime().toString(),
            displayType: DisplayType.CONTINUOUS,
            orderIndex: 0
          }
        ]
      };
      
      // Validação básica antes de enviar
      if (!createMonitorRequest.productId) {
        this.toastService.erro('Product ID is required');
        this.loading = false;
        return;
      }
      
      if (createMonitorRequest.size <= 0) {
        this.toastService.erro('Size must be greater than 0');
        this.loading = false;
        return;
      }
      
      this.monitorService.createMonitor(createMonitorRequest).subscribe(
        (newMonitor) => {
          this.monitors.push(newMonitor);
          this.toastService.sucesso('Monitor created successfully');
          this.dialogVisible = false;
          this.selectedMonitor = null;
          this.loading = false;
        },
        (error) => {
          this.toastService.erro('Error creating monitor');
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
