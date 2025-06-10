import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarService } from '@app/core/service/state/sidebar.service';
import { FormsModule } from '@angular/forms';
import { Authentication } from '@app/core/service/auth/autenthication';
import { ToastService } from '@app/core/service/state/toast.service';
import { PrimengModule } from '@app/shared/primeng/primeng.module';
import { Alert, CardAlertComponent } from '../card-alert/card-alert.component';
import { IconSearchComponent } from '@app/shared/icons/search.icon';

interface FilterOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-alert-admin-sidebar',
  standalone: true,
  imports: [
    CommonModule, 
    PrimengModule, 
    FormsModule, 
    CardAlertComponent,
    IconSearchComponent
  ],
  templateUrl: './alert-admin-sidebar.component.html',
  styleUrls: ['./alert-admin-sidebar.component.scss']
})
export class AlertAdminSidebarComponent implements OnInit {
  @Input() userName: string = 'Administrador';
  @Output() visibilityChange = new EventEmitter<boolean>();
  
  isVisible = true;
  isPinned = true;
  alerts: Alert[] = [];
  filteredAlerts: Alert[] = [];
  statusFilter: string = 'all';
  searchTerm: string = '';
  
  filterOptions: FilterOption[] = [
    { label: 'All', value: 'all' },
    { label: 'Critical', value: 'critical' },
    { label: 'Warnings', value: 'warning' },
    { label: 'Acknowledged', value: 'acknowledged' },
    { label: 'Resolved', value: 'resolved' }
  ];
  
  constructor(
    private readonly sidebarService: SidebarService,
    private readonly authentication: Authentication,
    private readonly toastService: ToastService
  ) {}
  
  ngOnInit(): void {
    // Remover verificação de visibilidade do sidebar service
    // Carregar dados do usuário se não tiver nome
    if (!this.userName || this.userName === 'Administrador') {
      const client = this.authentication._clientSignal();
      if (client) {
        this.userName = client.businessName;
      }
    }
    
    // Carregar alertas de exemplo para demonstração
    this.loadMockAlerts();
    this.applyFilters();
    
    // Notificar o serviço que este sidebar está aberto
    this.sidebarService.abrirMenu('admin-alerts');
    
    // Recuperar estado salvo de pinned
    const savedPinState = localStorage.getItem('admin_sidebar_pinned');
    if (savedPinState !== null) {
      this.isPinned = savedPinState === 'true';
    }
    
    // Se não estiver fixado, verificar se deve estar visível
    if (!this.isPinned) {
      const savedVisibility = localStorage.getItem('admin_sidebar_visible');
      this.isVisible = savedVisibility === 'true';
    }
    
    this.visibilityChange.emit(this.isVisible);
  }
  
  toggleSidebar(): void {
    this.isVisible = !this.isVisible;
    localStorage.setItem('admin_sidebar_visible', this.isVisible.toString());
    
    // Notificar outros componentes sobre a mudança de visibilidade
    this.visibilityChange.emit(this.isVisible);
    
    if (this.isVisible) {
      document.body.classList.add('admin-sidebar-open');
    } else {
      if (!this.isPinned) {
        document.body.classList.remove('admin-sidebar-open');
      }
    }
  }
  
  togglePin(): void {
    this.isPinned = !this.isPinned;
    localStorage.setItem('admin_sidebar_pinned', this.isPinned.toString());
    
    // Se desfixar e estiver invisível, notificar outros componentes
    if (!this.isPinned && !this.isVisible) {
      document.body.classList.remove('admin-sidebar-open');
    } else {
      document.body.classList.add('admin-sidebar-open');
    }
  }
  
  applyFilters(): void {
    let result = [...this.alerts];
    
    // Aplicar filtro de status
    if (this.statusFilter !== 'all') {
      result = result.filter(alert => alert.status === this.statusFilter);
    }
    
    // Aplicar filtro de busca
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      result = result.filter(alert => 
        alert.title.toLowerCase().includes(term) ||
        alert.description.toLowerCase().includes(term) ||
        alert.deviceId.toLowerCase().includes(term)
      );
    }
    
    this.filteredAlerts = result;
  }
  
  resolveAlert(alert: Alert): void {
    const index = this.alerts.findIndex(a => a.id === alert.id);
    if (index !== -1) {
      this.alerts[index].status = 'resolved';
      this.applyFilters();
      this.toastService.sucesso('Alert marked as resolved');
    }
  }
  
  acknowledgeAlert(data: { alert: Alert, reason: string }): void {
    const { alert, reason } = data;
    const index = this.alerts.findIndex(a => a.id === alert.id);
    if (index !== -1) {
      this.alerts[index].status = 'acknowledged';
      this.alerts[index].acknowledgeReason = reason;
      this.applyFilters();
      this.toastService.sucesso(`Alert acknowledged: ${reason}`);
    }
  }
  
  private loadMockAlerts(): void {
    this.alerts = [
      {
        id: '1',
        title: 'Display Panel Offline',
        description: 'Display panel #12345 has been offline for more than 24 hours.',
        timestamp: new Date(new Date().getTime() - 2 * 60 * 60 * 1000),
        status: 'critical',
        deviceId: 'DP-12345'
      },
      {
        id: '2',
        title: 'Connectivity Issues',
        description: 'Panel #67890 is experiencing intermittent connectivity issues.',
        timestamp: new Date(new Date().getTime() - 5 * 60 * 60 * 1000),
        status: 'warning',
        deviceId: 'DP-67890'
      },
      {
        id: '3',
        title: 'Power Failure',
        description: 'Panel #54321 reported power supply issues before going offline.',
        timestamp: new Date(new Date().getTime() - 12 * 60 * 60 * 1000),
        status: 'critical',
        deviceId: 'DP-54321'
      },
      {
        id: '4',
        title: 'System Reboot Required',
        description: 'Panel #98765 requires a system reboot to apply security updates.',
        timestamp: new Date(new Date().getTime() - 18 * 60 * 60 * 1000),
        status: 'warning',
        deviceId: 'DP-98765'
      },
      {
        id: '5',
        title: 'Display Calibration Needed',
        description: 'Panel #24680 color calibration is out of expected range.',
        timestamp: new Date(new Date().getTime() - 36 * 60 * 60 * 1000),
        status: 'resolved',
        deviceId: 'DP-24680'
      },
      {
        id: '6',
        title: 'Network Connection Unstable',
        description: 'Panel #13579 is experiencing intermittent network connection issues.',
        timestamp: new Date(new Date().getTime() - 8 * 60 * 60 * 1000),
        status: 'acknowledged',
        deviceId: 'DP-13579'
      }
    ];
  }
}
