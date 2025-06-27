import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimengModule } from '@app/shared/primeng/primeng.module';
import { FormsModule } from '@angular/forms';
import { IconsModule } from '@app/shared/icons/icons.module';
import { MonitorService } from '@app/core/service/api/monitor.service';
import { ToastService } from '@app/core/service/state/toast.service';
import { Monitor, MonitorType } from '@app/model/monitors';
import { DefaultStatus } from '@app/model/client';
import { CreateMonitorRequestDto } from '@app/model/dto/request/create-monitor.request.dto';
import { FilterMonitorRequestDto } from '@app/model/dto/request/filter-monitor.request.dto';
import { CreateMonitorModalComponent } from '../create-monitor-modal/create-monitor-modal.component';
import { MessageService } from 'primeng/api';

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
  @ViewChild('createMonitorModal') createMonitorModal!: CreateMonitorModalComponent;
  monitors: Monitor[] = [];
  selectedMonitor: Monitor | null = null;
  loading = false;
  dialogVisible = false;
  createMonitorModalVisible = false;
  searchTerm = '';
  totalRecords = 0;
  private isSorting = false;
  currentFilters: FilterMonitorRequestDto = {
    page: 1,
    size: 10,
    sortBy: 'active',
    sortDir: 'desc'
  };

  constructor(
    private readonly monitorService: MonitorService,
    private readonly toastService: ToastService,
    private readonly messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.loadInitialData();
  }

  loadInitialData(): void {
    this.loading = true;
    
    const filters: FilterMonitorRequestDto = { ...this.currentFilters };
    if (this.searchTerm.trim()) {
      filters.genericFilter = this.searchTerm.trim();
    }
    
    this.monitorService.getMonitorsWithPagination(filters).subscribe({
      next: (result) => {
        this.monitors = result.list;
        this.totalRecords = result.totalElements;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading initial monitors:', error);
        this.toastService.erro('Error loading monitors');
        this.loading = false;
      }
    });
  }

  loadMonitors(): void {
    this.loading = true;
    
    const filters: FilterMonitorRequestDto = { ...this.currentFilters };
    if (this.searchTerm.trim()) {
      filters.genericFilter = this.searchTerm.trim();
    }
    
    this.monitorService.getMonitorsWithPagination(filters).subscribe({
      next: (result) => {
        this.monitors = result.list;
        this.totalRecords = result.totalElements;
        this.loading = false;
        this.isSorting = false;
      },
      error: (error) => {
        console.error('Error loading monitors:', error);
        this.toastService.erro('Error loading monitors');
        this.loading = false;
        this.isSorting = false;
      }
    });
  }

  onSearch(): void {
    this.currentFilters.page = 1;
    this.loadMonitors();
  }

  onPageChange(event: any): void {
    this.currentFilters.page = event.page + 1;
    this.currentFilters.size = event.rows;
    this.loadMonitors();
  }

  onSort(event: any): void {
    if (this.isSorting || this.loading) {
      return;
    }
    
    const newSortBy = event.field;
    const newSortDir = event.order === 1 ? 'asc' : 'desc';
    
    if (this.currentFilters.sortBy === newSortBy && this.currentFilters.sortDir === newSortDir) {
      return;
    }
    
    this.isSorting = true;
    this.currentFilters.sortBy = event.field;
    this.currentFilters.sortDir = event.order === 1 ? 'asc' : 'desc';
    this.loadMonitors();
  }

  openCreateMonitorModal(): void {
    this.createMonitorModalVisible = true;
  }

  createMonitor(monitorRequest: CreateMonitorRequestDto): void {
    this.monitorService.createMonitor(monitorRequest).subscribe({
      next: (newMonitor) => {
        this.monitors = [...this.monitors, newMonitor];
        this.closeModal();
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Monitor criado com sucesso!'
        });
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Erro ao criar monitor. Verifique os dados e tente novamente.'
        });
      }
    });
  }

  closeModal(): void {
    this.createMonitorModalVisible = false;
  }

  onCreateMonitorModalClose(): void {
    this.createMonitorModalVisible = false;
  }

  onMonitorCreated(monitorRequest: CreateMonitorRequestDto): void {
    this.createMonitor(monitorRequest);
  }

  onSelectMonitor(monitor: Monitor): void {
    this.selectedMonitor = { ...monitor };
    this.dialogVisible = true;
  }

  updateMonitor(monitor: Monitor): void {
    if (!monitor) return;
    
    this.loading = true;
    
    if (monitor.id) {
      const monitorRequest: CreateMonitorRequestDto = {
        size: monitor.size,
        maxBlocks: monitor.maxBlocks,
        address: {
          complement: monitor.address.complement || '',
          street: monitor.address.street,
          city: monitor.address.city,
          state: monitor.address.state,
          country: monitor.address.country || 'US',
          zipCode: monitor.address.zipCode
        }
      };

      this.monitorService.updateMonitor(monitor.id, monitorRequest).subscribe({
        next: (updatedMonitor) => {
          const index = this.monitors.findIndex(m => m.id === updatedMonitor.id);
          if (index !== -1) {
            this.monitors[index] = updatedMonitor;
          }
          this.toastService.sucesso('Monitor updated successfully');
          this.dialogVisible = false;
          this.selectedMonitor = null;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error updating monitor:', error);
          this.toastService.erro('Error updating monitor');
          this.loading = false;
        }
      });
    }
  }

  deleteMonitor(id: string): void {
    if (confirm('Are you sure you want to delete this monitor?')) {
      this.loading = true;
      this.monitorService.deleteMonitor(id).subscribe({
        next: (success) => {
          if (success) {
            this.monitors = this.monitors.filter(m => m.id !== id);
            this.toastService.sucesso('Monitor deleted successfully');
          } else {
            this.toastService.erro('Error deleting monitor');
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Error deleting monitor:', error);
          this.toastService.erro('Error deleting monitor');
          this.loading = false;
        }
      });
    }
  }
}
