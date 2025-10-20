import { CommonModule } from "@angular/common";
import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnInit,
  Output,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { IMonitorAlert } from "@app/core/service/api/interfaces/monitor";
import { MonitorService } from "@app/core/service/api/monitor.service";
import { Authentication } from "@app/core/service/auth/autenthication";
import { LoadingService } from "@app/core/service/state/loading.service";
import { SidebarService } from "@app/core/service/state/sidebar.service";
import { ToastService } from "@app/core/service/state/toast.service";
import { IconCloseComponent } from "@app/shared/icons/close.icon";
import { IconLockOpenComponent } from "@app/shared/icons/lock-open.icon";
import { IconLockComponent } from "@app/shared/icons/lock.icon";
import { IconSearchComponent } from "@app/shared/icons/search.icon";
import { PrimengModule } from "@app/shared/primeng/primeng.module";
import { ProgressSpinnerModule } from "primeng/progressspinner";
import { CardAlertComponent } from "../card-alert/card-alert.component";

interface FilterOption {
  label: string;
  value: string;
}

interface ToggleAdminSidebarEvent {
  visible: boolean;
}

interface AdminSidebarPinChangedEvent {
  pinned: boolean;
  visible: boolean;
}

interface AlertCountEvent {
  count: number;
  hasCritical: boolean;
}

declare global {
  interface WindowEventMap {
    "toggle-admin-sidebar": CustomEvent<ToggleAdminSidebarEvent>;
    "admin-sidebar-visibility-changed": CustomEvent<ToggleAdminSidebarEvent>;
    "admin-sidebar-pin-changed": CustomEvent<AdminSidebarPinChangedEvent>;
    "admin-alert-count-changed": CustomEvent<AlertCountEvent>;
  }
}

@Component({
  selector: "app-alert-admin-sidebar",
  standalone: true,
  imports: [
    CommonModule,
    PrimengModule,
    FormsModule,
    CardAlertComponent,
    IconSearchComponent,
    IconCloseComponent,
    IconLockComponent,
    IconLockOpenComponent,
    ProgressSpinnerModule,
  ],
  templateUrl: "./alert-admin-sidebar.component.html",
  styleUrls: ["./alert-admin-sidebar.component.scss"],
})
export class AlertAdminSidebarComponent implements OnInit {
  @Input() userName: string = "Administrador";
  @Output() visibilityChange = new EventEmitter<boolean>();

  isVisible = false;
  isPinned = false;
  alerts: IMonitorAlert[] = [];
  filteredAlerts: IMonitorAlert[] = [];
  statusFilter: string = "all";
  searchTerm: string = "";

  filterOptions: FilterOption[] = [
    { label: "All", value: "all" },
    { label: "Critical", value: "critical" },
    { label: "Warnings", value: "warning" },
    { label: "Acknowledged", value: "acknowledged" },
    { label: "Resolved", value: "resolved" },
  ];

  constructor(
    private readonly sidebarService: SidebarService,
    private readonly authentication: Authentication,
    private readonly toastService: ToastService,
    private readonly monitorService: MonitorService,
    private readonly loadingService: LoadingService
  ) {}

  @HostListener("document:keydown.escape")
  fecharSidebarComEsc(): void {
    if (this.isVisible && !this.isPinned) {
      this.toggleSidebar();
    }
  }

  ngOnInit(): void {
    if (!this.userName || this.userName === "Administrador") {
      const client = this.authentication._clientSignal();
      if (client) {
        this.userName = client.businessName;
      }
    }

    this.loadAlerts();

    this.sidebarService.abrirMenu("admin-alerts");

    this.carregarEstadoSalvo();

    window.addEventListener(
      "toggle-admin-sidebar",
      (e: CustomEvent<ToggleAdminSidebarEvent>) => {
        if (e.detail && e.detail.visible !== undefined) {
          if (this.isVisible !== e.detail.visible) {
            this.toggleSidebar(true);
          }
        }
      }
    );
  }

  private loadAlerts(): void {
    this.loadingService.setLoading(true, "load-alerts");
    this.monitorService.getMonitorAlerts().subscribe({
      next: (alerts: IMonitorAlert[]) => {
        this.alerts = alerts;
        this.applyFilters();
        this.updateAlertCount();
        this.loadingService.setLoading(false, "load-alerts");
      },
      error: () => {
        this.toastService.erro("Erro ao carregar alertas");
        this.loadingService.setLoading(false, "load-alerts");
      },
    });
  }

  private carregarEstadoSalvo(): void {
    const savedPinState = localStorage.getItem("admin_sidebar_pinned");
    if (savedPinState !== null) {
      this.isPinned = savedPinState === "true";
    }

    const savedVisibility = localStorage.getItem("admin_sidebar_visible");
    this.isVisible = savedVisibility === "true";

    this.visibilityChange.emit(this.isVisible);

    if (this.isVisible || this.isPinned) {
      document.body.classList.add("admin-sidebar-open");
      if (this.isPinned) {
        document.body.classList.add("sidebar-pinned");
      }
    } else {
      document.body.classList.remove("admin-sidebar-open");
      document.body.classList.remove("sidebar-pinned");
    }
  }

  private isAdministrador(): boolean {
    return this.authentication._clientSignal()?.role === "ADMIN";
  }

  private updateAlertCount(): void {
    const pendingAlerts = this.alerts.filter(
      (alert) => alert.status === "critical" || alert.status === "warning"
    );

    const hasCritical = pendingAlerts.some(
      (alert) => alert.status === "critical"
    );

    const alertCountEvent = new CustomEvent<AlertCountEvent>(
      "admin-alert-count-changed",
      {
        detail: {
          count: pendingAlerts.length,
          hasCritical,
        },
      }
    );
    window.dispatchEvent(alertCountEvent);

    localStorage.setItem("admin_alert_count", pendingAlerts.length.toString());
    localStorage.setItem("admin_has_critical_alert", hasCritical.toString());
  }

  toggleSidebar(fromHeader = false): void {
    if (this.isPinned && !fromHeader) {
      return;
    }

    this.isVisible = !this.isVisible;
    localStorage.setItem("admin_sidebar_visible", this.isVisible.toString());

    this.visibilityChange.emit(this.isVisible);

    if (this.isVisible) {
      document.body.classList.add("admin-sidebar-open");
      if (this.isPinned) {
        document.body.classList.add("sidebar-pinned");
      }
    } else {
      if (!this.isPinned) {
        document.body.classList.remove("admin-sidebar-open");
      }
      document.body.classList.remove("sidebar-pinned");
    }

    if (!fromHeader) {
      const visibilityEvent = new CustomEvent<ToggleAdminSidebarEvent>(
        "admin-sidebar-visibility-changed",
        {
          detail: { visible: this.isVisible },
        }
      );
      window.dispatchEvent(visibilityEvent);
    }

    setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
    }, 300);
  }

  togglePin(evt?: Event): void {
    if (evt) {
      evt.stopPropagation();
    }

    this.isPinned = !this.isPinned;
    localStorage.setItem("admin_sidebar_pinned", this.isPinned.toString());

    if (this.isPinned && !this.isVisible) {
      this.isVisible = true;
      localStorage.setItem("admin_sidebar_visible", "true");
      this.visibilityChange.emit(true);
    }

    if (this.isPinned) {
      document.body.classList.add("admin-sidebar-open");
      document.body.classList.add("sidebar-pinned");
    } else {
      document.body.classList.remove("sidebar-pinned");
      if (!this.isVisible) {
        document.body.classList.remove("admin-sidebar-open");
      }
    }

    const pinEvent = new CustomEvent<AdminSidebarPinChangedEvent>(
      "admin-sidebar-pin-changed",
      {
        detail: { pinned: this.isPinned, visible: this.isVisible },
      }
    );
    window.dispatchEvent(pinEvent);

    setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
    }, 300);
  }

  closeOverlay(): void {
    if (!this.isPinned) {
      this.toggleSidebar();
    }
  }

  applyFilters(): void {
    let result = [...this.alerts];

    if (this.statusFilter !== "all") {
      result = result.filter((alert) => alert.status === this.statusFilter);
    }

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      result = result.filter(
        (alert) =>
          alert.title.toLowerCase().includes(term) ||
          alert.description.toLowerCase().includes(term) ||
          alert.deviceId.toLowerCase().includes(term)
      );
    }

    this.filteredAlerts = result;
  }

  resolveAlert(alert: IMonitorAlert): void {
    this.loadingService.setLoading(true, `resolve-alert-${alert.id}`);
    this.monitorService.resolveAlert(alert.id).subscribe(
      (updatedAlert: IMonitorAlert) => {
        const index = this.alerts.findIndex((a) => a.id === alert.id);
        if (index !== -1) {
          this.alerts[index] = updatedAlert;
          this.applyFilters();
          this.updateAlertCount();
          this.toastService.sucesso("Alerta marcado como resolvido");
        }
        this.loadingService.setLoading(false, `resolve-alert-${alert.id}`);
      },
      (error: Error) => {
        this.toastService.erro("Erro ao resolver alerta");
        this.loadingService.setLoading(false, `resolve-alert-${alert.id}`);
      }
    );
  }

  acknowledgeAlert(data: { alert: IMonitorAlert; reason: string }): void {
    const { alert, reason } = data;
    this.loadingService.setLoading(true, `acknowledge-alert-${alert.id}`);
    this.monitorService.acknowledgeAlert(alert.id, reason).subscribe(
      (updatedAlert: IMonitorAlert) => {
        const index = this.alerts.findIndex((a) => a.id === alert.id);
        if (index !== -1) {
          this.alerts[index] = updatedAlert;
          this.applyFilters();
          this.updateAlertCount();
          this.toastService.sucesso(`Alerta confirmado: ${reason}`);
        }
        this.loadingService.setLoading(false, `acknowledge-alert-${alert.id}`);
      },
      (error: Error) => {
        this.toastService.erro("Erro ao confirmar alerta");
        this.loadingService.setLoading(false, `acknowledge-alert-${alert.id}`);
      }
    );
  }

  get isLoading(): boolean {
    return this.loadingService.loadingSub.getValue();
  }
}
