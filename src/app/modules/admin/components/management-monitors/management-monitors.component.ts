import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimengModule } from '@app/shared/primeng/primeng.module';
import { FormsModule } from '@angular/forms';
import { IconsModule } from '@app/shared/icons/icons.module';
import { MonitorService } from '@app/core/service/api/monitor.service';
import { ToastService } from '@app/core/service/state/toast.service';
import { Monitor } from '@app/model/monitors';
import { CreateMonitorRequestDto } from '@app/model/dto/request/create-monitor.request.dto';
import { FilterMonitorRequestDto } from '@app/model/dto/request/filter-monitor.request.dto';
import { CreateMonitorModalComponent } from '../create-monitor-modal/create-monitor-modal.component';
import { MessageService } from 'primeng/api';
import { IconTvDisplayComponent } from '@app/shared/icons/tv-display.icon';

@Component({
  selector: 'app-management-monitors',
  standalone: true,
  imports: [
    CommonModule,
    PrimengModule,
    FormsModule,
    IconsModule,
    CreateMonitorModalComponent,
    IconTvDisplayComponent
  ],
  templateUrl: './management-monitors.component.html',
  styleUrls: ['./management-monitors.component.scss']
})
export class ManagementMonitorsComponent implements OnInit {
  @ViewChild('createMonitorModal') createMonitorModal!: CreateMonitorModalComponent;
  monitors: Monitor[] = [];
  selectedMonitor: Monitor | null = null;
  selectedMonitorForAds: Monitor | null = null;
  loading = false;
  dialogVisible = false;
  createMonitorModalVisible = false;
  adsModalVisible = false;
  searchTerm = '';
  totalRecords = 0;
  newAdLink = '';
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

  openAdsModal(monitor: Monitor): void {
    this.selectedMonitorForAds = { ...monitor };
    this.adsModalVisible = true;
    this.newAdLink = '';
  }

  closeAdsModal(): void {
    this.adsModalVisible = false;
    this.selectedMonitorForAds = null;
    this.newAdLink = '';
  }

  addAdLink(): void {
    if (!this.selectedMonitorForAds || !this.newAdLink || this.newAdLink.trim().length === 0) {
      return;
    }

    if (!this.selectedMonitorForAds.adLinks) {
      this.selectedMonitorForAds.adLinks = [];
    }

    // Verifica se o link já existe
    if (!this.selectedMonitorForAds.adLinks.includes(this.newAdLink.trim())) {
      this.selectedMonitorForAds.adLinks.push(this.newAdLink.trim());
      
      // Atualiza o monitor na lista principal
      const index = this.monitors.findIndex(m => m.id === this.selectedMonitorForAds?.id);
      if (index !== -1 && this.selectedMonitorForAds) {
        this.monitors[index] = { ...this.selectedMonitorForAds };
      }
      
      this.newAdLink = '';
      this.toastService.sucesso('Ad link added successfully');
    } else {
      this.toastService.erro('This ad link already exists');
    }
  }

  removeAdLink(index: number): void {
    if (!this.selectedMonitorForAds?.adLinks) {
      return;
    }

    if (confirm('Are you sure you want to remove this ad link?')) {
      this.selectedMonitorForAds.adLinks.splice(index, 1);
      
      // Atualiza o monitor na lista principal
      const monitorIndex = this.monitors.findIndex(m => m.id === this.selectedMonitorForAds?.id);
      if (monitorIndex !== -1 && this.selectedMonitorForAds) {
        this.monitors[monitorIndex] = { ...this.selectedMonitorForAds };
      }
      
      this.toastService.sucesso('Ad link removed successfully');
    }
  }

  getMonitorAddress(monitor: Monitor): string {
    if (!monitor.address) {
      return 'N/A';
    }

    // Primeiro tenta coordinatesParams
    if (monitor.address.coordinatesParams) {
      return monitor.address.coordinatesParams;
    }

    // Se não tiver coordinatesParams, monta o endereço manualmente
    const addressParts = [];
    
    if (monitor.address.street) {
      addressParts.push(monitor.address.street);
    }
    
    if (monitor.address.city) {
      addressParts.push(monitor.address.city);
    }
    
    if (monitor.address.state) {
      addressParts.push(monitor.address.state);
    }
    
    if (monitor.address.zipCode) {
      addressParts.push(monitor.address.zipCode);
    }

    return addressParts.length > 0 ? addressParts.join(', ') : 'N/A';
  }
}
