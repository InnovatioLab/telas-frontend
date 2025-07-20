import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdService } from '@app/core/service/api/ad.service';
import { Advertisement, AdvertisementStatus } from '@app/model/advertisement';
import { ToastService } from '@app/core/service/state/toast.service';
import { PrimengModule } from '@app/shared/primeng/primeng.module';
import { MessageService } from 'primeng/api';
import { IconSearchComponent } from '@app/shared/icons/search.icon';

@Component({
  selector: 'app-management-advertisements',
  standalone: true,
  imports: [
    CommonModule,
    PrimengModule,
    FormsModule,
    IconSearchComponent
  ],
  templateUrl: './management-advertisements.component.html',
  styleUrls: ['./management-advertisements.component.scss']
})
export class ManagementAdvertisementsComponent implements OnInit {
  advertisements: Advertisement[] = [];
  loading = false;
  searchTerm = '';
  totalRecords = 0;
  currentPage = 1;
  pageSize = 10;

  constructor(
    private readonly adService: AdService,
    private readonly toastService: ToastService,
    private readonly messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.loadAdvertisements();
  }

  loadAdvertisements(): void {
    this.loading = true;
    
    this.adService.getAllAds(this.currentPage - 1, this.pageSize).subscribe({
      next: (response) => {
        this.advertisements = (response.content || []).map(adDto => ({
          id: adDto.id,
          title: `Advertisement ${adDto.id}`,
          description: `Advertisement submitted on ${adDto.submissionDate}`,
          status: this.convertValidationTypeToStatus(adDto.validation),
          clientId: '',
          clientName: '',
          createdAt: adDto.submissionDate,
          updatedAt: adDto.submissionDate,
          link: adDto.link,
          imageUrl: '',
          startDate: '',
          endDate: '',
          priority: 0
        }));
        this.totalRecords = response.totalElements || 0;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading advertisements:', error);
        this.toastService.erro('Failed to load advertisements');
        this.loading = false;
      }
    });
  }

  private convertValidationTypeToStatus(validationType: string): AdvertisementStatus {
    switch (validationType?.toUpperCase()) {
      case 'APPROVED':
        return AdvertisementStatus.APPROVED;
      case 'REJECTED':
        return AdvertisementStatus.REJECTED;
      case 'PENDING':
        return AdvertisementStatus.PENDING;
      default:
        return AdvertisementStatus.PENDING;
    }
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadAdvertisements();
  }

  onPageChange(event: any): void {
    this.currentPage = event.page + 1;
    this.pageSize = event.rows;
    this.loadAdvertisements();
  }

  createAdvertisement(): void {
    this.toastService.sucesso('Create advertisement functionality will be implemented');
  }

  approveAdvertisement(advertisement: Advertisement): void {
    this.toastService.sucesso('Approve advertisement functionality will be implemented');
  }

  rejectAdvertisement(advertisement: Advertisement): void {
    this.toastService.sucesso('Reject advertisement functionality will be implemented');
  }

  deleteAdvertisement(advertisement: Advertisement): void {
    if (confirm(`Are you sure you want to delete advertisement ${advertisement.title}?`)) {
      this.toastService.sucesso('Delete advertisement functionality will be implemented');
    }
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'success';
      case 'pending':
        return 'warn';
      case 'rejected':
        return 'danger';
      default:
        return 'info';
    }
  }

  getStatusLabel(status: string): string {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'Approved';
      case 'pending':
        return 'Pending';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Unknown';
    }
  }
} 