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
import { ClientService } from "@app/core/service/api/client.service";
import { Authentication } from "@app/core/service/auth/autenthication";
import { LayoutService } from "@app/core/service/state/layout.service";
import { SidebarService } from "@app/core/service/state/sidebar.service";
import { AuthenticatedClientResponseDto } from "@app/model/dto/response/authenticated-client-response.dto";
import { IconHelpComponent } from "@app/shared/icons/help.icon";
import { IconPlaceComponent } from "@app/shared/icons/place.icon";
import { SubscriptionsIconComponent } from "@app/shared/icons/subscriptions.icon";
import { DialogoUtils } from "@app/shared/utils/dialogo-config.utils";
import { DialogModule } from "primeng/dialog";
import { DialogService, DynamicDialogRef } from "primeng/dynamicdialog";
import { Subscription } from "rxjs";
import { IconCloseComponent } from "../../icons/close.icon";
import { IconFavoriteComponent } from "../../icons/favorite.icon";
import { IconHomeComponent } from "../../icons/home.icon";
import { IconLockComponent } from "../../icons/lock.icon";
import { IconLogoutComponent } from "../../icons/logout.icon";
import { IconSettingsComponent } from "../../icons/settings.icon";
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
  selector: "app-client-menu-side",
  standalone: true,
  imports: [
    CommonModule,
    PrimengModule,
    DialogModule,
    ToggleComponent,
    IconHomeComponent,
    IconFavoriteComponent,
    IconSettingsComponent,
    IconLockComponent,
    IconLogoutComponent,
    IconCloseComponent,
    IconPlaceComponent,
    SubscriptionsIconComponent,
  ],
  providers: [DialogService, DialogoUtils],
  templateUrl: "./client-menu-side.component.html",
  styleUrls: ["./client-menu-side.component.scss"],
})
export class ClientMenuSideComponent implements OnInit, OnDestroy {
  private readonly layoutService = inject(LayoutService);
  private readonly sidebarService = inject(SidebarService);
  private readonly renderer = inject(Renderer2);
  private readonly router = inject(Router);
  private readonly authentication = inject(Authentication);
  private readonly authenticationService = inject(AutenticacaoService);
  private readonly dialogService = inject(DialogService);
  private readonly clientService = inject(ClientService);

  showPaymentModal = false;
  private sidebarSubscription: Subscription;
  private layoutSubscription: Subscription;
  refDialogo: DynamicDialogRef | undefined;
  isDarkMode = false;

  // Layout state
  isMenuOpen = this.layoutService.isMenuOpen;
  isMobile = this.layoutService.isMobile;
  isMobileCompact = this.layoutService.isMobileCompact;
  currentSidebarWidth = this.layoutService.currentSidebarWidth;

  private allMenuItems: MenuItem[] = [
    { id: "home", label: "Home", icon: "pi-home" },
    { id: "profile", label: "Profile", icon: "pi-cog" },
    { id: "wishList", label: "Wish list", icon: "pi-heart" },
    { id: "myTelas", label: "My telas", icon: "pi-map-marker" },
    { id: "subscriptions", label: "Subscriptions", icon: "pi-desktop" },
    { id: "profile", label: "Profile", icon: "pi-cog" },
    {
      id: "changePassword",
      label: "Change Password",
      icon: "pi-question-circle",
    },
    { id: "logout", label: "Logout", icon: "pi-sign-out" },
  ];

  menuItems: MenuItem[] = [
    { id: "home", label: "Home", icon: "pi-home" },
    { id: "profile", label: "Profile", icon: "pi-cog" },

    { id: "wishList", label: "Wish list", icon: "pi-heart" },
    { id: "myTelas", label: "My telas", icon: "pi-map-marker" },
    { id: "subscriptions", label: "Subscriptions", icon: "pi-desktop" },
    {
      id: "changePassword",
      label: "Change Password",
      icon: "pi-question-circle",
    },
    { id: "logout", label: "Logout", icon: "pi-sign-out" },
  ];

  loading = false;
  authenticatedClient: AuthenticatedClientResponseDto | null = null;

  ngOnInit(): void {
    this.setupSubscriptions();
    this.loadAuthenticatedClient();
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

        if (isVisible && tipo === "client-menu") {
          // Só atualiza o layoutService se ainda não estiver aberto
          if (!this.layoutService.isMenuOpen()) {
            this.layoutService.openMenu("client");
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
      this.renderer.addClass(document.body, "client-menu-active");
    } else {
      this.renderer.removeClass(document.body, "menu-open");
      this.renderer.removeClass(document.body, "client-menu-active");
    }
  }

  @HostListener("document:keydown.escape")
  fecharMenuComEsc(): void {
    if (this.isMenuOpen()) {
      this.toggleMenu();
    }

    if (this.showPaymentModal) {
      this.showPaymentModal = false;
    }
  }

  loadAuthenticatedClient(): void {
    this.loading = true;
    this.clientService.getAuthenticatedClient().subscribe({
      next: (client) => {
        this.authenticatedClient = client;
        this.loading = false;
        this.updateMenuItems();
      },
      error: (error) => {
        console.error("Error while getting logged client:", error);
        this.loading = false;
        this.updateMenuItems();
      },
    });
  }

  private updateMenuItems(): void {
    let filteredItems = [...this.allMenuItems];

    if (this.authenticatedClient) {
      if (this.authenticatedClient.shouldDisplayAttachments === false) {
        filteredItems = filteredItems.filter((item) => item.id !== "myTelas");
      }

      if (this.authenticatedClient.hasSubscription === false) {
        filteredItems = filteredItems.filter(
          (item) => item.id !== "subscriptions"
        );
      }
    }

    this.menuItems = filteredItems;
  }

  toggleMenu(): void {
    const isCurrentlyOpen = this.isMenuOpen();

    if (isCurrentlyOpen) {
      // Fechando o menu - sincronizar ambos os serviços
      this.layoutService.closeMenu();
      this.sidebarService.fechar();
    } else {
      // Abrindo o menu - sincronizar ambos os serviços
      this.layoutService.openMenu("client");
      this.sidebarService.abrirMenu("client-menu");
    }
  }

  selecionarOpcao(item: MenuItem): void {
    switch (item.id) {
      case "home":
        this.navegarPaginaInicial();
        break;
      case "logout":
        this.logout();
        break;
      case "profile":
        this.navegarParaPerfil();
        break;
      case "changePassword":
        this.navegarParaAlterarSenha();
        break;
      case "wishList":
        this.navegarParaWishList();
        break;
      case "myTelas":
        this.navegarParaMyTelas();
        break;
      case "subscriptions":
        this.navegarParaSubscriptions();
        break;
      default:
        break;
    }
  }

  navegarParaWishList(): void {
    this.router.navigate(["/client/wishlist"]);
    if (this.isMenuOpen()) {
      this.toggleMenu();
    }
  }

  navegarParaMyTelas(): void {
    this.router.navigate(["/client/my-telas"]);
    if (this.isMenuOpen()) {
      this.toggleMenu();
    }
  }

  navegarParaSubscriptions(): void {
    this.router.navigate(["/client/subscriptions"]);
    if (this.isMenuOpen()) {
      this.toggleMenu();
    }
  }

  navegarParaMyTelasAds(): void {
    this.router.navigate(["/client/my-telas"]);

    if (this.isMenuOpen()) {
      this.toggleMenu();
    }
  }

  logout() {
    const config = DialogoUtils.exibirAlerta(
      "Are you sure you want to logout?",
      {
        acaoPrimaria: "Logout",
        acaoPrimariaCallback: () => {
          this.refDialogo.close();
          this.desconectar();
        },
        acaoSecundaria: "Stay",
        acaoSecundariaCallback: () => {
          this.refDialogo.close();
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
    this.router.navigate(["/client"]);

    if (this.isMenuOpen()) {
      this.toggleMenu();
    }
  }

  isAdministrador(): boolean {
    return this.authentication?._clientSignal()?.role === "ADMIN";
  }

  navegarParaPerfil(): void {
    this.router.navigate(["/client/profile"]);
    if (this.isMenuOpen()) {
      this.toggleMenu();
    }
  }

  navegarParaAlterarSenha(): void {
    this.router.navigate(["/client/change-password"]);
    if (this.isMenuOpen()) {
      this.toggleMenu();
    }
  }

  getMenuItemTooltip(item: MenuItem): string {
    switch (item.id) {
      case "home":
        return "Go to home page";
      case "payments":
        return "Manage your payments";
      case "wishList":
        return "View your saved items";
      case "map":
        return "View your ad campaigns";
      case "profile":
        return "Edit your profile";
      case "changePassword":
        return "Change your account password";
      case "myTelas":
        return "View your ads";
      case "subscriptions":
        return "Manage your subscriptions";
      case "logout":
        return "Sign out from your account";
      default:
        return item.label;
    }
  }

  getIconComponent(iconName: string): any {
    const iconMap: { [key: string]: any } = {
      "pi-home": IconHomeComponent,
      "pi-heart": IconFavoriteComponent,
      "pi-map-marker": IconPlaceComponent,
      "pi-cog": IconSettingsComponent,
      "pi-question-circle": IconHelpComponent,
      "pi-sign-out": IconLogoutComponent,
    };

    return iconMap[iconName] ?? null;
  }
}
