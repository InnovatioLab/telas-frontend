import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ClientManagementService, FilterClientRequestDto } from '@app/core/service/api/client-management.service';
import { ClientService } from '@app/core/service/api/client.service';
import { ToastService } from '@app/core/service/state/toast.service';
import { Client, Role } from '@app/model/client';
import { IconSearchComponent } from '@app/shared/icons/search.icon';
import { PrimengModule } from '@app/shared/primeng/primeng.module';
import { ConfirmationDialogService } from '@app/shared/services/confirmation-dialog.service';
import { MessageService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { EditClientModalComponent } from '../edit-client-modal/edit-client-modal.component';

@Component({
  selector: 'app-management-clients',
  standalone: true,
  imports: [
    CommonModule,
    PrimengModule,
    FormsModule,
    IconSearchComponent
  ],
  templateUrl: './management-clients.component.html',
  styleUrls: ['./management-clients.component.scss']
})
export class ManagementClientsComponent implements OnInit {
  clients: Client[] = [];
  loading = false;
  searchTerm = '';
  totalRecords = 0;
  currentPage = 1;
  pageSize = 10;
  currentFilters: FilterClientRequestDto = {
    page: 1,
    size: 10,
    sortBy: 'name',
    sortDir: 'asc'
  };

  constructor(
    private readonly clientManagementService: ClientManagementService,
    private readonly clientService: ClientService,
    private readonly toastService: ToastService,
    private readonly messageService: MessageService,
    private readonly confirmationDialogService: ConfirmationDialogService,
    private readonly dialogService: DialogService
  ) {}

  ngOnInit(): void {
    this.loadClients();
  }

  loadClients(): void {
    this.loading = true;
    
    const filters: FilterClientRequestDto = {
      page: this.currentFilters.page || 1,
      size: this.currentFilters.size || 10,
      sortBy: this.currentFilters.sortBy || 'name',
      sortDir: this.currentFilters.sortDir || 'asc'
    };
    
    if (this.currentFilters.genericFilter) {
      filters.genericFilter = this.currentFilters.genericFilter;
    }
    
    this.clientManagementService.getClientsWithPagination(filters).subscribe({
      next: (result) => {
        this.clients = result.list || [];
        this.totalRecords = result.totalElements || 0;
        this.loading = false;
        
        console.log('Clients loaded:', {
          clients: this.clients.length,
          totalRecords: this.totalRecords,
          currentPage: result.currentPage,
          totalPages: result.totalPages
        });
      },
      error: (error) => {
        console.error('Error loading clients:', error);
        this.toastService.erro('Failed to load clients');
        this.loading = false;
      }
    });
  }

  onSearch(): void {
    this.currentFilters.page = 1;
    this.currentFilters.genericFilter = this.searchTerm.trim();
    this.loadClients();
  }

  onPageChange(event: any): void {
    this.currentFilters.page = event.page + 1;
    this.currentFilters.size = event.rows;
    this.loadClients();
  }

  onSort(event: any): void {
    this.currentFilters.sortBy = event.field;
    this.currentFilters.sortDir = event.order === 1 ? 'asc' : 'desc';
    this.loadClients();
  }

  async makePartner(client: Client): Promise<void> {
    const clientName = client.businessName || client.owner?.name || 'Unknown';
    
    const confirmed = await this.confirmationDialogService.confirm({
      title: 'Make Partner',
      message: `Are you sure you want to make ${clientName} a partner?`,
      confirmLabel: 'Make Partner',
      cancelLabel: 'Cancel',
      severity: 'info'
    });

    if (confirmed) {
      this.loading = true;
      
      this.clientManagementService.makePartner(client.id!).subscribe({
        next: (updatedClient) => {
          this.toastService.sucesso('Client successfully made partner');
          
          const index = this.clients.findIndex(c => c.id === client.id);
          if (index !== -1) {
            this.clients[index] = { ...this.clients[index], role: Role.PARTNER };
          }
          
          this.loading = false;
        },
        error: (error) => {
          console.error('Error making client partner:', error);
          this.toastService.erro('Failed to make client partner');
          this.loading = false;
        }
      });
    }
  }

  getPartnerStatusSeverity(role: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    return role === Role.PARTNER ? 'success' : 'info';
  }

  getPartnerStatusLabel(role: string): string {
    return role === Role.PARTNER ? 'Partner' : 'Client';
  }

  getRoleLabel(role: string): string {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'Administrator';
      case 'client':
        return 'Client';
      case 'partner':
        return 'Partner';
      default:
        return role || 'Unknown';
    }
  }

  createClient(): void {
    this.toastService.sucesso('Create client functionality will be implemented');
  }

  editClient(client: Client): void {
    if (!client.id) {
      this.toastService.erro('Client ID not found');
      return;
    }

    this.loading = true;
    
    this.clientService.buscarClient<Client>(client.id).subscribe({
      next: (fullClient) => {
        this.loading = false;
        
        const ref: DynamicDialogRef = this.dialogService.open(EditClientModalComponent, {
          data: { client: fullClient },
          header: 'Edit Client',
          width: '900px',
          contentStyle: { 
            'max-height': '90vh', 
            'overflow': 'auto',
            'padding': '0',
            'display': 'flex',
            'flex-direction': 'column'
          },
          baseZIndex: 10000
        });

        ref.onClose.subscribe((result: any) => {
          if (result && result.success) {
            const index = this.clients.findIndex(c => c.id === client.id);
            if (index !== -1) {
              this.clients[index] = { ...this.clients[index], ...result.client };
            }
          }
        });
      },
      error: (error) => {
        console.error('Error loading client details:', error);
        this.toastService.erro('Failed to load client details');
        this.loading = false;
      }
    });
  }

  async deleteClient(client: Client): Promise<void> {
    const clientName = client.businessName || client.owner?.name || 'Unknown';
    
    const confirmed = await this.confirmationDialogService.confirm({
      title: 'Delete Client',
      message: `Are you sure you want to delete client ${clientName}?`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      severity: 'error'
    });

    if (confirmed) {
      this.toastService.sucesso('Delete client functionality will be implemented');
    }
  }
} 