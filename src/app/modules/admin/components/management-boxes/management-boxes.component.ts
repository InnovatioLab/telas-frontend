import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { BoxService } from "@app/core/service/api/box.service";
import { MonitorService } from "@app/core/service/api/monitor.service";
import { ToastService } from "@app/core/service/state/toast.service";
import { Box } from "@app/model/box";
import { BoxAddress } from "@app/model/box-address";
import { BoxRequestDto } from "@app/model/dto/request/box-request.dto";
import { FilterBoxRequestDto } from "@app/model/dto/request/filter-box-request.dto";
import { MonitorBoxMinResponseDto } from "@app/model/dto/response/monitor-box-min-response.dto";
import { IconsModule } from "@app/shared/icons/icons.module";
import { PrimengModule } from "@app/shared/primeng/primeng.module";
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
  availableBoxAddresses: BoxAddress[] = [];
  selectedBoxForEdit: Box | null = null;
  selectedBoxAddress: BoxAddress | null = null;
  loading = false;
  createBoxModalVisible = false;
  editBoxModalVisible = false;
  searchTerm = '';
  totalRecords = 0;
  private isSorting = false;
  
  newBox: BoxRequestDto = {
    boxAddressId: '',
    monitorIds: [],
    active: true
  };
  
  availableMonitors: MonitorBoxMinResponseDto[] = [];
  loadingMonitors = false;
  loadingBoxAddresses = false;
  
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
        this.toastService.erro('Error loading boxes');
        this.loading = false;
      }
    });
  }

  loadAvailableBoxAddresses(): void {
    this.loadingBoxAddresses = true;
    this.boxService.getAvailableBoxAddresses().subscribe({
      next: (boxAddresses) => {
        this.availableBoxAddresses = boxAddresses || [];
        this.loadingBoxAddresses = false;
      },
      error: (error) => {
        this.toastService.erro('Error loading box addresses');
        this.loadingBoxAddresses = false;
      }
    });
  }

  loadAvailableMonitors(): void {
    this.loadingMonitors = true;
    this.boxService.getAvailableMonitors().subscribe({
      next: (monitors) => {
        this.availableMonitors = monitors;
        this.loadingMonitors = false;
      },
      error: (error) => {
        this.toastService.erro('Error loading monitors');
        this.loadingMonitors = false;
      }
    });
  }

  onBoxAddressChange(selectedBoxAddress: BoxAddress): void {
    if (selectedBoxAddress) {
      this.newBox.boxAddressId = selectedBoxAddress.id;
    }
  }

  onEditBoxAddressChange(selectedBoxAddress: BoxAddress): void {
    if (selectedBoxAddress && this.selectedBoxForEdit) {
      this.selectedBoxForEdit.boxAddressId = selectedBoxAddress.id;
    }
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
      boxAddressId: '',
      monitorIds: [],
      active: true
    };
    this.selectedBoxAddress = null;
    this.loadAvailableBoxAddresses();
    this.loadAvailableMonitors();
    this.createBoxModalVisible = true;
  }

  onCreateBox(): void {
    
    if (!this.newBox.boxAddressId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Box Address is required'
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
  }

  onBoxCreated(boxRequest: BoxRequestDto): void {
    this.createBox(boxRequest);
  }

  onEditBox(): void {
    if (!this.selectedBoxForEdit) return;
    
    if (!this.selectedBoxForEdit.boxAddressId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Box Address is required'
      });
      return;
    }
    
    this.updateBox({
      id: this.selectedBoxForEdit.id,
      data: {
        boxAddressId: this.selectedBoxForEdit.boxAddressId,
        monitorIds: this.selectedBoxForEdit.monitorIds,
        active: this.selectedBoxForEdit.active
      }
    });
  }

  onSelectBox(box: Box): void {
    this.selectedBoxForEdit = { ...box };
    this.selectedBoxAddress = null;
    
    const boxAddress = this.availableBoxAddresses.find(addr => addr.ip === box.ip);
    if (boxAddress) {
      this.selectedBoxAddress = boxAddress;
      this.selectedBoxForEdit.boxAddressId = boxAddress.id;
    }
    
    this.loadAvailableBoxAddresses();
    this.loadAvailableMonitors();
    this.editBoxModalVisible = true;
  }

  updateBox(updateData: { id: string; data: BoxRequestDto }): void {
    this.boxService.updateBox(updateData.id, updateData.data).subscribe({
      next: (updatedBox) => {
        this.editBoxModalVisible = false;
        this.selectedBoxForEdit = null;
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Box updated successfully!'
        });
        this.loadBoxes();
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error updating box. Please check the data and try again.'
        });
      }
    });
  }

  onEditBoxModalClose(): void {
    this.editBoxModalVisible = false;
    this.selectedBoxForEdit = null;
  }

  onBoxUpdated(updateData: { id: string; data: BoxRequestDto }): void {
    this.updateBox(updateData);
  }

  deleteBox(id: string): void {
    this.boxService.deleteBox(id).subscribe({
      next: (success) => {
        if (success) {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Box deleted successfully!'
          });
          this.loadBoxes();
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error deleting box.'
          });
        }
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error deleting box.'
        });
      }
    });
  }

  getBoxDisplayName(box: Box): string {
    return `${box.ip} (${box.monitorCount || 0} monitors)`;
  }
}