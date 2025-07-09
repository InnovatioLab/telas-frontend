import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { IconsModule } from "@app/shared/icons/icons.module";
import { PrimengModule } from "@app/shared/primeng/primeng.module";
import { Box } from "@app/model/box";
import { BoxRequestDto } from "@app/model/dto/request/box-request.dto";
import { FilterBoxRequestDto } from "@app/model/dto/request/filter-box-request.dto";
import { BoxService } from "@app/core/service/api/box.service";
import { MonitorService } from "@app/core/service/api/monitor.service";
import { Monitor } from "@app/model/monitors";
import { ToastService } from "@app/core/service/state/toast.service";
import { MessageService } from "primeng/api";

@Component({
  selector: 'app-management-boxes',
  standalone: true,
  imports: [
    CommonModule,
    PrimengModule,
    FormsModule,
    IconsModule,
  ],
  templateUrl: './management-boxes.component.html',
  styleUrls: ['./management-boxes.component.scss']
})
export class ManagementBoxesComponent implements OnInit {
  boxes: Box[] = [];
  selectedBoxForEdit: Box | null = null;
  loading = false;
  createBoxModalVisible = false;
  editBoxModalVisible = false;
  searchTerm = '';
  totalRecords = 0;
  private isSorting = false;
  
  newBox: BoxRequestDto = {
    ip: '',
    monitorIds: [],
    active: true
  };
  
  availableMonitors: Monitor[] = [];
  filteredMonitorsByIp: Monitor[] = [];
  loadingMonitors = false;
  previousIp = '';
  
  currentFilters: FilterBoxRequestDto = {
    page: 1,
    size: 10,
    sortBy: 'active',
    sortDir: 'desc'
  };

  constructor(
    private readonly boxService: BoxService,
    private readonly monitorService: MonitorService,
    private readonly toastService: ToastService,
    private readonly messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.loadInitialData();
  }

  loadInitialData(): void {
    this.loading = true;
    
    const filters: FilterBoxRequestDto = { ...this.currentFilters };
    if (this.searchTerm.trim()) {
      filters.genericFilter = this.searchTerm.trim();
    }
    
    this.boxService.getBoxesWithPagination(filters).subscribe({
      next: (result) => {
        this.boxes = result.list;
        this.totalRecords = result.totalElements;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading initial boxes:', error);
        this.toastService.erro('Error loading boxes');
        this.loading = false;
      }
    });
  }

  loadAvailableMonitors(): void {
    this.monitorService.getMonitors().subscribe({
      next: (monitors) => {
        this.availableMonitors = monitors;
      },
      error: (error) => {
        console.error('Error loading monitors:', error);
        this.toastService.erro('Error loading monitors');
      }
    });
  }

  loadMonitorsByIp(ip: string): void {
    if (!ip?.trim()) {
      this.filteredMonitorsByIp = [];
      return;
    }

    if (ip === this.previousIp) {
      return;
    }

    this.loadingMonitors = true;
    this.previousIp = ip;

    this.boxService.getMonitorsAdsByIp(ip.trim()).subscribe({
      next: (monitors) => {
        this.filteredMonitorsByIp = monitors;
        this.loadingMonitors = false;
        
        if (monitors.length === 0) {
          this.messageService.add({
            severity: 'warn',
            summary: 'Warning',
            detail: 'No monitors found for this IP address.'
          });
        }
      },
      error: (error) => {
        console.error('Error loading monitors by IP:', error);
        this.filteredMonitorsByIp = [];
        this.loadingMonitors = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error loading monitors for this IP address.'
        });
      }
    });
  }

  onIpChange(ip: string, isEdit: boolean = false): void {
    if (isEdit && this.selectedBoxForEdit) {
      this.selectedBoxForEdit.monitorIds = [];
    } else {
      this.newBox.monitorIds = [];
    }
    
    this.loadMonitorsByIp(ip);
  }

  loadBoxes(): void {
    this.loading = true;
    
    const filters: FilterBoxRequestDto = { ...this.currentFilters };
    if (this.searchTerm.trim()) {
      filters.genericFilter = this.searchTerm.trim();
    }
    
    this.boxService.getBoxesWithPagination(filters).subscribe({
      next: (result) => {
        this.boxes = result.list;
        this.totalRecords = result.totalElements;
        this.loading = false;
        this.isSorting = false;
      },
      error: (error) => {
        console.error('Error loading boxes:', error);
        this.toastService.erro('Error loading boxes');
        this.loading = false;
        this.isSorting = false;
      }
    });
  }

  onSearch(): void {
    this.currentFilters.page = 1;
    this.loadBoxes();
  }

  onPageChange(event: any): void {
    this.currentFilters.page = event.page + 1;
    this.currentFilters.size = event.rows;
    this.loadBoxes();
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
    this.loadBoxes();
  }

  openCreateBoxModal(): void {
    this.newBox = {
      ip: '',
      monitorIds: [],
      active: true
    };
    this.filteredMonitorsByIp = [];
    this.previousIp = '';
    this.createBoxModalVisible = true;
  }

  onCreateBox(): void {
    if (!this.newBox.ip.trim()) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'IP Address is required'
      });
      return;
    }
    
    this.createBox(this.newBox);
  }

  createBox(boxRequest: BoxRequestDto): void {
    this.boxService.createBox(boxRequest).subscribe({
      next: (newBox) => {
        this.closeModal();
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Box created successfully!'
        });
        this.loadBoxes();
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error creating box. Please check the data and try again.'
        });
      }
    });
  }

  closeModal(): void {
    this.createBoxModalVisible = false;
  }

  onCreateBoxModalClose(): void {
    this.createBoxModalVisible = false;
    this.filteredMonitorsByIp = [];
    this.previousIp = '';
  }

  onBoxCreated(boxRequest: BoxRequestDto): void {
    this.createBox(boxRequest);
  }

  onEditBox(): void {
    if (!this.selectedBoxForEdit) return;
    
    if (!this.selectedBoxForEdit.ip.trim()) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'IP Address is required'
      });
      return;
    }
    
    const updateData: BoxRequestDto = {
      ip: this.selectedBoxForEdit.ip,
      monitorIds: this.selectedBoxForEdit.monitorIds || [],
      active: this.selectedBoxForEdit.active
    };
    
    this.updateBox({ id: this.selectedBoxForEdit.id, data: updateData });
  }

  onSelectBox(box: Box): void {
    this.selectedBoxForEdit = { ...box };
    this.previousIp = '';
    if (box.ip) {
      this.loadMonitorsByIp(box.ip);
    } else {
      this.filteredMonitorsByIp = [];
    }
    this.editBoxModalVisible = true;
  }

  updateBox(updateData: { id: string; data: BoxRequestDto }): void {
    this.loading = true;
    
    this.boxService.updateBox(updateData.id, updateData.data).subscribe({
      next: (updatedBox) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Box updated successfully!'
        });
        this.onEditBoxModalClose();
        this.loadBoxes();
      },
      error: (error) => {
        console.error('Error updating box:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error updating box. Please check the data and try again.'
        });
        this.loading = false;
      }
    });
  }

  onEditBoxModalClose(): void {
    this.editBoxModalVisible = false;
    this.selectedBoxForEdit = null;
    this.filteredMonitorsByIp = [];
    this.previousIp = '';
  }

  onBoxUpdated(updateData: { id: string; data: BoxRequestDto }): void {
    this.updateBox(updateData);
  }

  deleteBox(id: string): void {
    if (confirm('Are you sure you want to delete this box?')) {
      this.loading = true;
      this.boxService.deleteBox(id).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Box deleted successfully!'
          });
          this.loadBoxes();
        },
        error: (error) => {
          console.error('Error deleting box:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error deleting box.'
          });
          this.loading = false;
        }
      });
    }
  }

  getBoxDisplayName(box: Box): string {
    return `Box ${box.ip}`;
  }
}