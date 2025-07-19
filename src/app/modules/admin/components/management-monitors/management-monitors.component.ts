import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MonitorService } from '@app/core/service/api/monitor.service';
import { ToastService } from '@app/core/service/state/toast.service';
import { CreateMonitorRequestDto, UpdateMonitorRequestDto } from '@app/model/dto/request/create-monitor.request.dto';
import { FilterMonitorRequestDto } from '@app/model/dto/request/filter-monitor.request.dto';
import { Monitor } from '@app/model/monitors';
import { IconsModule } from '@app/shared/icons/icons.module';
import { IconTvDisplayComponent } from '@app/shared/icons/tv-display.icon';
import { PrimengModule } from '@app/shared/primeng/primeng.module';
import { MessageService } from 'primeng/api';
import { CreateMonitorModalComponent } from '../create-monitor-modal/create-monitor-modal.component';
import { EditMonitorModalComponent } from '../edit-monitor-modal/edit-monitor-modal.component';

@Component({
  selector: 'app-management-monitors',
  standalone: true,
  imports: [
    CommonModule,
    PrimengModule,
    FormsModule,
    IconsModule,
    CreateMonitorModalComponent,
    EditMonitorModalComponent,
    IconTvDisplayComponent
  ],
  templateUrl: './management-monitors.component.html',
  styleUrls: ['./management-monitors.component.scss']
})
export class ManagementMonitorsComponent implements OnInit {
  @ViewChild('createMonitorModal') createMonitorModal!: CreateMonitorModalComponent;
  @ViewChild('editMonitorModal') editMonitorModal!: EditMonitorModalComponent;
  monitors: Monitor[] = [];
  selectedMonitorForAds: Monitor | null = null;
  selectedMonitorForEdit: Monitor | null = null;
  selectedMonitorForDelete: Monitor | null = null;
  loading = false;
  createMonitorModalVisible = false;
  editMonitorModalVisible = false;
  adsModalVisible = false;
  deleteConfirmModalVisible = false;
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
        this.monitors = result.list || [];
        this.totalRecords = this.ensureValidNumber(result.totalElements ?? (result as any).totalRecords ?? 0);
        this.loading = false;
      },
      error: (error) => {
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
        this.monitors = result.list || [];
        this.totalRecords = this.ensureValidNumber(result.totalElements ?? result.totalRecords ?? 0);
        this.loading = false;
        this.isSorting = false;
      },
      error: (error) => {
        this.toastService.erro('Error loading monitors');
        this.loading = false;
        this.isSorting = false;
      }
    });
  }

  ensureValidNumber(value: any): number {
    const num = Number(value);
    return isNaN(num) ? 0 : num;
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
        this.closeModal();
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Monitor created successfully!'
        });
        this.loadMonitors();
      },
      error: (error) => {
        this.closeModal();
        this.messageService.add({
          severity: 'warn',
          summary: 'Warning',
          detail: 'Monitor created, but API response did not return the monitor. Reloading table.'
        });
        this.loadMonitors();
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
    this.selectedMonitorForEdit = { ...monitor };
    this.editMonitorModalVisible = true;
  }

  updateMonitor(updateData: { id: string; data: UpdateMonitorRequestDto }): void {
    this.loading = true;
    
    this.monitorService.updateMonitor(updateData.id, updateData.data).subscribe({
      next: (updatedMonitor) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Monitor updated successfully!'
        });
        this.onEditMonitorModalClose();
        this.loadMonitors();
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error updating monitor. Please check the data and try again.'
        });
        this.loading = false;
      }
    });
  }

  onEditMonitorModalClose(): void {
    this.editMonitorModalVisible = false;
    this.selectedMonitorForEdit = null;
  }

  onMonitorUpdated(updateData: { id: string; data: UpdateMonitorRequestDto }): void {
    this.updateMonitor(updateData);
  }

  deleteMonitor(monitor: Monitor): void {
    if (!this.monitorService.canDeleteMonitor(monitor)) {
      const restrictionReason = this.monitorService.getDeleteRestrictionReason(monitor);
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: restrictionReason || 'This monitor cannot be deleted at this time.'
      });
      return;
    }
    
    this.selectedMonitorForDelete = { ...monitor };
    this.deleteConfirmModalVisible = true;
  }

  confirmDelete(): void {
    if (!this.selectedMonitorForDelete) {
      return;
    }

    this.loading = true;
    
    this.monitorService.deleteMonitor(this.selectedMonitorForDelete.id).subscribe({
      next: (success) => {
        if (success) {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Monitor deleted successfully!'
          });
          this.loadMonitors();
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error deleting monitor. Please try again.'
          });
        }
        this.loading = false;
        this.closeDeleteConfirmModal();
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error deleting monitor. Please check your connection and try again.'
        });
        this.loading = false;
        this.closeDeleteConfirmModal();
      }
    });
  }

  closeDeleteConfirmModal(): void {
    this.deleteConfirmModalVisible = false;
    this.selectedMonitorForDelete = null;
  }

  openAdsModal(monitor: Monitor): void {
    this.selectedMonitorForAds = { ...monitor };
    this.adsModalVisible = true;
    this.newAdLink = '';
    
    this.loadValidAds(monitor.id);
  }

  loadValidAds(monitorId: string): void {
    this.monitorService.getValidAds(monitorId).subscribe({
      next: (validAds) => {
        if (this.selectedMonitorForAds) {
          this.selectedMonitorForAds.validAds = validAds;
        }
      },
      error: (error) => {
        this.toastService.erro('Error loading valid ads');
      }
    });
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

    if (!this.selectedMonitorForAds.adLinks.includes(this.newAdLink.trim())) {
      this.selectedMonitorForAds.adLinks.push(this.newAdLink.trim());
      
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

  addValidAd(ad: any): void {
    if (!this.selectedMonitorForAds) {
      return;
    }

    if (!this.selectedMonitorForAds.adLinks) {
      this.selectedMonitorForAds.adLinks = [];
    }

    const adUrl = ad.url || ad.link || ad.id;
    if (adUrl && !this.selectedMonitorForAds.adLinks.includes(adUrl)) {
      this.selectedMonitorForAds.adLinks.push(adUrl);
      
      const index = this.monitors.findIndex(m => m.id === this.selectedMonitorForAds?.id);
      if (index !== -1 && this.selectedMonitorForAds) {
        this.monitors[index] = { ...this.selectedMonitorForAds };
      }
      
      this.toastService.sucesso('Ad link added successfully');
    } else {
      this.toastService.erro('This ad link already exists or is invalid');
    }
  }

  removeAdLink(index: number): void {
    if (!this.selectedMonitorForAds?.adLinks) {
      return;
    }

    if (confirm('Are you sure you want to remove this ad link?')) {
      this.selectedMonitorForAds.adLinks.splice(index, 1);
      
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

    if (monitor.address.coordinatesParams) {
      return monitor.address.coordinatesParams;
    }

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

  getMonitorDetails(monitor: Monitor): string {
    const details = [];
    
    if (monitor.size) {
      details.push(`Size: ${monitor.size}"`);
    }
    
    if (monitor.type) {
      details.push(`Type: ${monitor.type}`);
    }
    
    if (monitor.adLinks && monitor.adLinks.length > 0) {
      details.push(`Ads: ${monitor.adLinks.length}`);
    }
    
    return details.join(' • ');
  }

  canDeleteMonitor(monitor: Monitor): boolean {
    return this.monitorService.canDeleteMonitor(monitor);
  }

  getDeleteTooltip(monitor: Monitor): string {
    if (this.canDeleteMonitor(monitor)) {
      return 'Delete Monitor';
    }
    
    const restrictionReason = this.monitorService.getDeleteRestrictionReason(monitor);
    return restrictionReason || 'This monitor cannot be deleted';
  }

  getDeleteButtonClass(monitor: Monitor): string {
    const baseClass = 'p-button-rounded p-button-danger p-button-text';
    if (!this.canDeleteMonitor(monitor)) {
      return baseClass + ' p-button-disabled';
    }
    return baseClass;
  }
}
