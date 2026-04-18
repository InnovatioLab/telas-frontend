import { CommonModule } from "@angular/common";
import {
  Component,
  HostListener,
  OnDestroy,
  OnInit,
  Renderer2,
  inject,
} from "@angular/core";
import { Router } from "@angular/router";
import { AutenticacaoService } from "@app/core/service/api/autenticacao.service";
import { Authentication } from "@app/core/service/auth/autenthication";
import { Role } from "@app/model/client";
import { MonitoringPermission } from "@app/model/monitoring-permission";
import { LayoutService } from "@app/core/service/state/layout.service";
import { SidebarService } from "@app/core/service/state/sidebar.service";
import { ToggleModeService } from "@app/core/service/state/toggle-mode.service";
import { IconDocumentoComponent } from "@app/shared/icons/documento.icon";
import { IconEtiquetaComponent } from "@app/shared/icons/etiqueta.icon";
import { IconTestingComponent } from "@app/shared/icons/testing.icon";
import { IconsModule } from "@app/shared/icons/icons.module";
import { DialogoUtils } from "@app/shared/utils/dialogo-config.utils";
import { DialogModule } from "primeng/dialog";
import { DialogService, DynamicDialogRef } from "primeng/dynamicdialog";
import { Subscription } from "rxjs";
import { PrimengModule } from "../../primeng/primeng.module";
import { DialogoComponent } from "../dialogo/dialogo.component";
import { ToggleComponent } from "../toogle/toogle.component";

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  action?: string;
}

@Component({
  selector: "app-admin-menu-side",
  standalone: true,
  imports: [
    CommonModule,
    PrimengModule,
    DialogModule,
    ToggleComponent,
    IconsModule,
    IconDocumentoComponent,
    IconEtiquetaComponent,
    IconTestingComponent,
  ],
  providers: [DialogService, DialogoUtils],
  templateUrl: "./admin-menu-side.component.html",
  styleUrls: ["./admin-menu-side.component.scss"],
})
export class AdminMenuSideComponent implements OnInit, OnDestroy {
  private readonly layoutService = inject(LayoutService);
  private readonly sidebarService = inject(SidebarService);
  private readonly renderer = inject(Renderer2);
  private readonly router = inject(Router);
  private readonly authentication = inject(Authentication);
  private readonly authenticationService = inject(AutenticacaoService);
  private readonly dialogService = inject(DialogService);
  private readonly toggleModeService = inject(ToggleModeService);

  private sidebarSubscription: Subscription;
  private layoutSubscription: Subscription;
  refDialogo: DynamicDialogRef | undefined;
  isDarkMode = false;

  isMenuOpen = this.layoutService.isMenuOpen;
  isMobile = this.layoutService.isMobile;
  isMobileCompact = this.layoutService.isMobileCompact;
  currentSidebarWidth = this.layoutService.currentSidebarWidth;

  readonly menuItems: MenuItem[] = [
    { id: "home", label: "Maps", icon: "dashboard" },
    { id: "profile", label: "Profile", icon: "pi-cog" },

    { id: "screens", label: "Screens", icon: "tv-display" },
    { id: "boxes", label: "Boxes", icon: "box" },
    { id: "ads", label: "Ads", icon: "etiqueta" },
    { id: "clients", label: "Clients", icon: "user" },
    {
      id: "adOperations",
      label: "Ads & subscriptions",
      icon: "tv-display",
    },
    { id: "logs", label: "Logs", icon: "pi-file" },
    { id: "testing", label: "Testing", icon: "testing" },
    { id: "access", label: "Permissions", icon: "permissions" },
    {
      id: "changePassword",
      label: "Change Password",
      icon: "pi-question-circle",
    },
    { id: "logout", label: "Logout", icon: "pi-sign-out" },
  ];

  get filteredMenuItems(): MenuItem[] {
    const c = this.authentication.client();
    const role = c?.role;
    const perms = c?.permissions ?? [];
    const isDev = role === Role.DEVELOPER;

    return this.menuItems.filter((item) => {
      if (item.id === "logs") {
        return (
          isDev ||
          perms.includes(MonitoringPermission.MONITORING_LOGS_VIEW) ||
          perms.includes(MonitoringPermission.MONITORING_SCHEDULER_VIEW) ||
          perms.includes(MonitoringPermission.MONITORING_BOX_PING_VIEW)
        );
      }
      if (item.id === "testing") {
        return (
          isDev ||
          perms.includes(MonitoringPermission.MONITORING_TESTING_VIEW)
        );
      }
      if (item.id === "access") {
        return isDev;
      }
      return true;
    });
  }

  ngOnInit(): void {
    this.setupSubscriptions();
    this.toggleModeService.theme$.subscribe((theme: string) => {
      this.isDarkMode = theme === "dark";
    });

    const loadEvent = new CustomEvent("admin-menu-loaded");
    window.dispatchEvent(loadEvent);
  }

  ngOnDestroy(): void {
    if (this.sidebarSubscription) {
      this.sidebarSubscription.unsubscribe();
    }
    if (this.layoutSubscription) {
      this.layoutSubscription.unsubscribe();
    }
  }

  private setupSubscriptions(): void {
    this.sidebarSubscription = this.sidebarService.atualizarLista.subscribe(
      () => {
        const isVisible = this.sidebarService.visibilidade();
        const tipo = this.sidebarService.tipo();

        if (isVisible && tipo === "admin-menu") {
          if (!this.layoutService.isMenuOpen()) {
            this.layoutService.openMenu("admin");
          }
        } else if (!isVisible) {
          if (this.layoutService.isMenuOpen()) {
            this.layoutService.closeMenu();
          }
        }
      }
    );

    this.layoutSubscription = this.layoutService.layoutChange$.subscribe(
      (state) => {
        this.updateBodyClasses(state);
      }
    );
  }

  private updateBodyClasses(state: any): void {
    if (state.menuOpen) {
      this.renderer.addClass(document.body, "menu-open");
      this.renderer.addClass(document.body, "admin-menu-active");
    } else {
      this.renderer.removeClass(document.body, "menu-open");
      this.renderer.removeClass(document.body, "admin-menu-active");
    }
  }

  @HostListener("document:keydown.escape")
  fecharMenuComEsc(): void {
    if (this.isMenuOpen()) {
      this.toggleMenu();
    }
  }

  toggleMenu(): void {
    const isCurrentlyOpen = this.isMenuOpen();

    if (isCurrentlyOpen) {
      this.layoutService.closeMenu();
      this.sidebarService.fechar();
    } else {
      this.layoutService.openMenu("admin");
      this.sidebarService.abrirMenu("admin-menu");
    }
  }

  selecionarOpcao(item: MenuItem): void {
    switch (item.id) {
      case "home":
        this.navegarPaginaInicial();
        break;
      case "users":
        this.navegarParaUsers();
        break;
      case "screens":
        this.navegarParaScreens();
        break;
      case "boxes":
        this.navegarParaBoxes();
        break;
      case "ads":
        this.navegarParaAds();
        break;
      case "clients":
        this.navegarParaClients();
        break;
      case "adOperations":
        this.navegarParaAdOperations();
        break;
      case "logs":
        this.navegarParaLogs();
        break;
      case "testing":
        this.navegarParaTesting();
        break;
      case "access":
        this.navegarParaAccess();
        break;
      case "alerts":
        this.toggleAdminSidebar();
        break;
      case "profile":
        this.navegarParaPerfil();
        break;
      case "changePassword":
        this.navegarParaAlterarSenha();
        break;
      case "logout":
        this.logout();
        break;
      default:
        break;
    }
  }

  navegarParaUsers(): void {
    this.router.navigate(["/admin/users"]);
    if (this.isMenuOpen()) {
      this.toggleMenu();
    }
  }

  navegarParaPerfil(): void {
    this.router.navigate(["/admin/profile"]);
    if (this.isMenuOpen()) {
      this.toggleMenu();
    }
  }

  navegarParaAlterarSenha(): void {
    this.router.navigate(["/admin/change-password"]);
    if (this.isMenuOpen()) {
      this.toggleMenu();
    }
  }

  navegarParaScreens(): void {
    this.router.navigate(["/admin/screens"]);
    if (this.isMenuOpen()) {
      this.toggleMenu();
    }
  }

  navegarParaBoxes(): void {
    this.router.navigate(["/admin/boxes"]);
    if (this.isMenuOpen()) {
      this.toggleMenu();
    }
  }

  navegarParaAds(): void {
    this.router.navigate(["/admin/ads"]);
    if (this.isMenuOpen()) {
      this.toggleMenu();
    }
  }

  navegarParaClients(): void {
    this.router.navigate(["/admin/clients"]);
    if (this.isMenuOpen()) {
      this.toggleMenu();
    }
  }

  navegarParaAdOperations(): void {
    this.router.navigate(["/admin/ad-operations"]);
    if (this.isMenuOpen()) {
      this.toggleMenu();
    }
  }

  navegarParaLogs(): void {
    this.router.navigate(["/admin/logs"]);
    if (this.isMenuOpen()) {
      this.toggleMenu();
    }
  }

  navegarParaTesting(): void {
    this.router.navigate(["/admin/testing"]);
    if (this.isMenuOpen()) {
      this.toggleMenu();
    }
  }

  navegarParaAccess(): void {
    this.router.navigate(["/admin/access"]);
    if (this.isMenuOpen()) {
      this.toggleMenu();
    }
  }

  toggleAdminSidebar(): void {
    const event = new CustomEvent("toggle-admin-sidebar", {
      detail: { visible: true },
    });
    window.dispatchEvent(event);

    if (this.isMenuOpen()) {
      this.toggleMenu();
    }
  }

  abrirHelp(): void {
    if (this.isMenuOpen()) {
      this.toggleMenu();
    }
  }

  logout() {
    const config = DialogoUtils.exibirAlerta(
      "Are you sure you want to logout?",
      {
        acaoPrimaria: "Stay",
        acaoPrimariaCallback: () => {
          this.refDialogo.close();
        },
        acaoSecundaria: "Logout",
        acaoSecundariaCallback: () => {
          this.refDialogo.close();
          this.desconectar();
        },
      }
    );

    this.refDialogo = this.dialogService.open(DialogoComponent, config);
  }

  desconectar() {
    this.authenticationService.logout();
    this.authentication.removerAutenticacao();
    window.location.href = "/";
  }

  navegarPaginaInicial(): void {
    this.router.navigate(["/admin"]);

    if (this.isMenuOpen()) {
      this.toggleMenu();
    }
  }

  getMenuItemTooltip(item: MenuItem): string {
    switch (item.id) {
      case "home":
        return "View maps";
      case "users":
        return "Manage users";
      case "screens":
        return "Manage screens";
      case "boxes":
        return "Manage boxes";
      case "ads":
        return "Manage ads and requests";
      case "clients":
        return "Manage clients";
      case "adOperations":
        return "Operational view: ads, screens, subscriptions, reminders";
      case "logs":
        return "Application logs, scheduled jobs, and box telemetry";
      case "testing":
        return "Heartbeat, monitors and smart plug checks";
      case "access":
        return "Grant monitoring access to admin users";
      case "alerts":
        return "View system alerts";
      case "profile":
        return "Edit your profile";
      case "changePassword":
        return "Change your account password";
      case "logout":
        return "Sign out from your account";
      default:
        return item.label;
    }
  }
}
