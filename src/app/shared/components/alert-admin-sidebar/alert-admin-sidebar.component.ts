import { Component, Input, OnInit, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarService } from '@app/core/service/state/sidebar.service';
import { FormsModule } from '@angular/forms';
import { Authentication } from '@app/core/service/auth/autenthication';
import { ToastService } from '@app/core/service/state/toast.service';
import { PrimengModule } from '@app/shared/primeng/primeng.module';
import { Alert, CardAlertComponent } from '../card-alert/card-alert.component';
import { IconSearchComponent } from '@app/shared/icons/search.icon';
import { IconCloseComponent } from '@app/shared/icons/close.icon';
import { IconLockComponent } from '@app/shared/icons/lock.icon';
import { IconLockOpenComponent } from '@app/shared/icons/lock-open.icon';

interface FilterOption {
  label: string;
  value: string;
}

// Definindo a interface para os eventos personalizados
interface ToggleAdminSidebarEvent {
  visible: boolean;
}

interface AdminSidebarPinChangedEvent {
  pinned: boolean;
  visible: boolean;
}

// Declarando os tipos de eventos personalizados que serão usados
declare global {
  interface WindowEventMap {
    'toggle-admin-sidebar': CustomEvent<ToggleAdminSidebarEvent>;
    'admin-sidebar-visibility-changed': CustomEvent<ToggleAdminSidebarEvent>;
    'admin-sidebar-pin-changed': CustomEvent<AdminSidebarPinChangedEvent>;
  }
}

@Component({
  selector: 'app-alert-admin-sidebar',
  standalone: true,
  imports: [
    CommonModule, 
    PrimengModule, 
    FormsModule, 
    CardAlertComponent,
    IconSearchComponent,
    IconCloseComponent,
    IconLockComponent,
    IconLockOpenComponent
  ],
  templateUrl: './alert-admin-sidebar.component.html',
  styleUrls: ['./alert-admin-sidebar.component.scss']
})
export class AlertAdminSidebarComponent implements OnInit {
  @Input() userName: string = 'Administrador';
  @Output() visibilityChange = new EventEmitter<boolean>();
  
  isVisible = false;
  isPinned = false;
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
  
  @HostListener('document:keydown.escape')
  fecharSidebarComEsc(): void {
    if (this.isVisible && !this.isPinned) {
      this.toggleSidebar();
    }
  }
  
  ngOnInit(): void {
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
    
    // Carregar estado salvo
    this.carregarEstadoSalvo();
    
    // Escutar eventos para sincronizar com o botão do header
    window.addEventListener('toggle-admin-sidebar', (e: CustomEvent<ToggleAdminSidebarEvent>) => {
      if (e.detail && e.detail.visible !== undefined) {
        // Apenas toggle se o evento vem do header e o estado atual é diferente
        if (this.isVisible !== e.detail.visible) {
          this.toggleSidebar(true);
        }
      }
    });
  }
  
  private carregarEstadoSalvo(): void {
    // Recuperar estado salvo de pinned
    const savedPinState = localStorage.getItem('admin_sidebar_pinned');
    if (savedPinState !== null) {
      this.isPinned = savedPinState === 'true';
    }
    
    // Verificar visibilidade salva
    const savedVisibility = localStorage.getItem('admin_sidebar_visible');
    this.isVisible = savedVisibility === 'true';
    
    // Notificar outros componentes sobre o estado inicial
    this.visibilityChange.emit(this.isVisible);
    
    // Aplicar a classe ao body apenas se o sidebar estiver visível ou fixado
    if (this.isVisible || this.isPinned) {
      document.body.classList.add('admin-sidebar-open');
      if (this.isPinned) {
        document.body.classList.add('sidebar-pinned');
      }
    } else {
      document.body.classList.remove('admin-sidebar-open');
      document.body.classList.remove('sidebar-pinned');
    }
  }
  
  toggleSidebar(fromHeader = false): void {
    // Se estiver fixado, não permitir fechar pelo botão de toggle
    if (this.isPinned && !fromHeader) {
      return;
    }
    
    this.isVisible = !this.isVisible;
    localStorage.setItem('admin_sidebar_visible', this.isVisible.toString());
    
    // Notificar outros componentes sobre a mudança de visibilidade
    this.visibilityChange.emit(this.isVisible);
    
    if (this.isVisible) {
      document.body.classList.add('admin-sidebar-open');
      if (this.isPinned) {
        document.body.classList.add('sidebar-pinned');
      }
    } else {
      if (!this.isPinned) {
        document.body.classList.remove('admin-sidebar-open');
      }
      document.body.classList.remove('sidebar-pinned');
    }
    
    // Dispara um evento para sincronizar com o header, se não foi iniciado por ele
    if (!fromHeader) {
      const visibilityEvent = new CustomEvent<ToggleAdminSidebarEvent>('admin-sidebar-visibility-changed', {
        detail: { visible: this.isVisible }
      });
      window.dispatchEvent(visibilityEvent);
    }
    
    // Disparar evento de resize para ajustar o mapa
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 300);
  }
  
  togglePin(evt?: Event): void {
    if (evt) {
      evt.stopPropagation();
    }
    
    this.isPinned = !this.isPinned;
    localStorage.setItem('admin_sidebar_pinned', this.isPinned.toString());
    
    // Se fixado, garantir que esteja visível
    if (this.isPinned && !this.isVisible) {
      this.isVisible = true;
      localStorage.setItem('admin_sidebar_visible', 'true');
      this.visibilityChange.emit(true);
    }
    
    // Atualizar classes do body para controle do CSS
    if (this.isPinned) {
      document.body.classList.add('admin-sidebar-open');
      document.body.classList.add('sidebar-pinned');
    } else {
      document.body.classList.remove('sidebar-pinned');
      if (!this.isVisible) {
        document.body.classList.remove('admin-sidebar-open');
      }
    }
    
    // Dispara um evento para sincronizar com o header
    const pinEvent = new CustomEvent<AdminSidebarPinChangedEvent>('admin-sidebar-pin-changed', {
      detail: { pinned: this.isPinned, visible: this.isVisible }
    });
    window.dispatchEvent(pinEvent);
    
    // Disparar evento de resize para ajustar o mapa
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 300);
  }
  
  closeOverlay(): void {
    if (!this.isPinned) {
      this.toggleSidebar();
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
