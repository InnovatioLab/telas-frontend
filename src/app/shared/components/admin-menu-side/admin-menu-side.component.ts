import { CommonModule } from "@angular/common";
import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  Renderer2,
  inject,
} from "@angular/core";
import { Router } from "@angular/router";
import { AutenticacaoService } from "@app/core/service/api/autenticacao.service";
import { Authentication } from "@app/core/service/auth/autenthication";
import { LayoutService } from "@app/core/service/state/layout.service";
import { SidebarService } from "@app/core/service/state/sidebar.service";
import { ToggleModeService } from "@app/core/service/state/toggle-mode.service";
import { IconDocumentoComponent } from "@app/shared/icons/documento.icon";
import { IconEtiquetaComponent } from "@app/shared/icons/etiqueta.icon";
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
  ],
  providers: [DialogService, DialogoUtils],
  templateUrl: "./admin-menu-side.component.html",
  styleUrls: ["./admin-menu-side.component.scss"],
})
export class AdminMenuSideComponent implements OnInit, OnDestroy {
  private readonly layoutService = inject(LayoutService);
  private readonly sidebarService = inject(SidebarService);
  private readonly elementRef = inject(ElementRef);
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

  // Layout state
  isMenuOpen = this.layoutService.isMenuOpen;
  isMobile = this.layoutService.isMobile;
  isMobileCompact = this.layoutService.isMobileCompact;
  currentSidebarWidth = this.layoutService.currentSidebarWidth;

  menuItems: MenuItem[] = [
    { id: "home", label: "Maps", icon: "dashboard" },
    { id: "screens", label: "Screens", icon: "tv-display" },
    { id: "boxes", label: "Boxes", icon: "box" },
    { id: "ads", label: "Ads", icon: "etiqueta" },
    { id: "clients", label: "Clients", icon: "user" },
    { id: "logout", label: "Logout", icon: "pi-sign-out" },
  ];

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
    // Subscription para o sidebar service (usado pelo header)
    this.sidebarSubscription = this.sidebarService.atualizarLista.subscribe(
      () => {
        const isVisible = this.sidebarService.visibilidade();
        const tipo = this.sidebarService.tipo();

        if (isVisible && tipo === "admin-menu") {
          // Só atualiza o layoutService se ainda não estiver aberto
          if (!this.layoutService.isMenuOpen()) {
            this.layoutService.openMenu("admin");
          }
        } else if (!isVisible) {
          // Só fecha o layoutService se ainda estiver aberto
          if (this.layoutService.isMenuOpen()) {
            this.layoutService.closeMenu();
          }
        }
      }
    );

    // Subscription para o layout service
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
      // Fechando o menu - sincronizar ambos os serviços
      this.layoutService.closeMenu();
      this.sidebarService.fechar();
    } else {
      // Abrindo o menu - sincronizar ambos os serviços
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
      case "alerts":
        this.toggleAdminSidebar();
        break;
      case "settings":
        this.navegarParaConfiguracoes();
        break;
      case "help":
        this.abrirHelp();
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

  navegarParaConfiguracoes(): void {
    this.router.navigate(["/admin/settings"]);
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
        return "Go to dashboard";
      case "users":
        return "Manage system users";
      case "monitors":
        return "View system monitors";
      case "boxes":
        return "Manage system boxes";
      case "advertisements":
        return "Manage advertisements";
      case "clients":
        return "Manage system clients";
      case "alerts":
        return "View system alerts";
      case "settings":
        return "Configure system settings";
      case "help":
        return "Get help and support";
      case "logout":
        return "Sign out from your account";
      default:
        return item.label;
    }
  }
}
