import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdService } from '@app/core/service/api/ad.service';
import { AdResponseDto } from '@app/model/dto/response/ad-response.dto';
import { ToastService } from '@app/core/service/state/toast.service';
import { PrimengModule } from '@app/shared/primeng/primeng.module';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-management-advertisements',
  standalone: true,
  imports: [
    CommonModule,
    PrimengModule,
    FormsModule
  ],
  templateUrl: './management-advertisements.component.html',
  styleUrls: ['./management-advertisements.component.scss']
})
export class ManagementAdvertisementsComponent implements OnInit {
  advertisements: AdResponseDto[] = [];
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
        this.advertisements = response.content || [];
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

  onSearch(): void {
    this.currentPage = 1;
    this.loadAdvertisements();
  }

  onPageChange(event: any): void {
    this.currentPage = event.page + 1;
    this.pageSize = event.rows;
    this.loadAdvertisements();
  }

  approveAdvertisement(ad: AdResponseDto): void {
    // Implementar lógica de aprovação
    this.toastService.sucesso('Advertisement approved successfully');
    this.loadAdvertisements();
  }

  rejectAdvertisement(ad: AdResponseDto): void {
    // Implementar lógica de rejeição
    this.toastService.sucesso('Advertisement rejected successfully');
    this.loadAdvertisements();
  }

  deleteAdvertisement(ad: AdResponseDto): void {
    if (confirm('Are you sure you want to delete this advertisement?')) {
      // Implementar lógica de exclusão
      this.toastService.sucesso('Advertisement deleted successfully');
      this.loadAdvertisements();
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