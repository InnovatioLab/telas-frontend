import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdService } from '@app/core/service/api/ad.service';
import { Advertisement, AdvertisementStatus } from '@app/model/advertisement';
import { ToastService } from '@app/core/service/state/toast.service';
import { PrimengModule } from '@app/shared/primeng/primeng.module';
import { MessageService } from 'primeng/api';
import { IconSearchComponent } from '@app/shared/icons/search.icon';
import { HttpClient } from '@angular/common/http';
import { IconUploadComponent } from '@app/shared/icons/upload.icon';
import { AutenticacaoService } from '@app/core/service/api/autenticacao.service';
import { ClientManagementService } from '@app/core/service/api/client-management.service';
import { Client } from '@app/model/client';
import { ClientService } from '@app/core/service/api/client.service';
import { CreateClientAdDto } from '@app/model/dto/request/create-client-ad.dto';

@Component({
  selector: 'app-management-advertisements',
  standalone: true,
  imports: [
    CommonModule,
    PrimengModule,
    FormsModule,
    IconSearchComponent,
    IconUploadComponent
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
  showCreateAdModal = false;
  newAd: any = { name: '', type: '', bytes: '', adRequestId: '' };
  loadingCreateAd = false;
  selectedFile: File | null = null;
  clients: Client[] = [];
  selectedClientId: string = '';

  constructor(
    private readonly adService: AdService,
    private readonly toastService: ToastService,
    private readonly messageService: MessageService,
    private readonly http: HttpClient,
    private readonly autenticacaoService: AutenticacaoService,
    private readonly clientManagementService: ClientManagementService,
    private readonly clientService: ClientService
  ) {}

  ngOnInit(): void {
    const user = this.autenticacaoService.user;
    if (user) {
      this.clientService.setClientAtual(user);
    }
    this.loadAdvertisements();
  }

  loadAdvertisements(): void {
    this.loading = true;
    
    this.clientService.getAllAds(this.currentPage, this.pageSize).subscribe({
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

  openCreateAdModal() {
    this.newAd = { name: '', type: '', bytes: '' };
    this.selectedFile = null;
    this.showCreateAdModal = true;
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.newAd.name = file.name;
      this.newAd.type = file.type;
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        this.newAd.bytes = base64;
      };
      reader.readAsDataURL(file);
    }
  }

  createAdvertisement() {
    if (!this.selectedFile || !this.newAd.bytes) return;
    this.loadingCreateAd = true;
    const client = this.autenticacaoService.user;
    console.log('Creating advertisement for client:', client);
    if (!client?.id) {
      this.toastService.erro('Client ID not found');
      this.loadingCreateAd = false;
      return;
    }
    const payload: CreateClientAdDto = {
      name: this.selectedFile.name,
      type: this.selectedFile.type,
      bytes: this.newAd.bytes
    };
    this.adService.createClientAd(client.id, payload).subscribe({
      next: () => {
        this.loadingCreateAd = false;
        this.showCreateAdModal = false;
        this.loadAdvertisements();
        this.toastService.sucesso('Advertisement created successfully');
      },
      error: () => {
        this.loadingCreateAd = false;
        this.toastService.erro('Failed to create advertisement');
      }
    });
  }

  getCurrentClientId(): string {
    return '';
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