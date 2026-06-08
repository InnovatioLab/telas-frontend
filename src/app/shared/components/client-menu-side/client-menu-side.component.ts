import { CommonModule } from "@angular/common";
import { Component, OnInit, OnDestroy, inject } from "@angular/core";
import { Router } from "@angular/router";
import { AutenticacaoService } from "@app/core/service/api/autenticacao.service";
import { ClientService } from "@app/core/service/api/client.service";
import { Authentication } from "@app/core/service/auth/autenthication";
import { PARTNER_PORTAL_ROUTES } from "@app/core/constants/partner-api.paths";
import { Client, isPartnerRole, isPrivilegedPanelRole } from "@app/model/client";
import { AuthenticatedClientResponseDto } from "@app/model/dto/response/authenticated-client-response.dto";
import { DialogoUtils } from "@app/shared/utils/dialogo-config.utils";
import { DialogModule } from "primeng/dialog";
import { DialogService, DynamicDialogRef } from "primeng/dynamicdialog";
import { Subscription, of } from "rxjs";
import { switchMap, take } from "rxjs/operators";
import { BaseSidebarComponent, MenuItem } from "../base-sidebar/base-sidebar.component";
import { DialogoComponent } from "../dialogo/dialogo.component";

@Component({
  selector: "app-client-menu-side",
  standalone: true,
  imports: [
    CommonModule,
    DialogModule,
    BaseSidebarComponent,
  ],
  providers: [DialogService, DialogoUtils],
  templateUrl: "./client-menu-side.component.html",
  styleUrls: ["./client-menu-side.component.scss"],
})
export class ClientMenuSideComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly authentication = inject(Authentication);
  private readonly authenticationService = inject(AutenticacaoService);
  private readonly dialogService = inject(DialogService);
  private readonly clientService = inject(ClientService);

  showPaymentModal = false;
  refDialogo: DynamicDialogRef | undefined;

  private static readonly PARTNER_ONLY_MENU_IDS = new Set([
    "partnerScreens",
    "partnerMap",
    "partnerAds",
  ]);

  private static readonly PARTNER_MENU_IDS = new Set([
    "partnerScreens",
    "partnerMap",
    "partnerAds",
    "profile",
    "changePassword",
    "logout",
  ]);

  private allMenuItems: MenuItem[] = [
    { id: "home", label: "Home", icon: "pi-home" },
    { id: "partnerScreens", label: "My screens", icon: "pi-desktop" },
    { id: "partnerMap", label: "Map", icon: "pi-map-marker" },
    { id: "partnerAds", label: "Review ads", icon: "pi-check-square" },
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

  menuItems: MenuItem[] = [];
  loading = false;
  authenticatedClient: AuthenticatedClientResponseDto | Client | null = null;

  ngOnInit(): void {
    this.loadAuthenticatedClient();
  }

  ngOnDestroy(): void {
    // Cleanup handled by base-sidebar
  }

  loadAuthenticatedClient(): void {
    this.loading = true;
    this.clientService.clientAtual$
      .pipe(
        take(1),
        switchMap((client) =>
          client ? of(client) : this.clientService.getAuthenticatedClient()
        )
      )
      .subscribe({
        next: (client) => {
          this.authenticatedClient = client;
          this.loading = false;
          this.updateMenuItems();
        },
        error: (error) => {
          this.loading = false;
          this.updateMenuItems();
        },
      });
  }

  private updateMenuItems(): void {
    let filteredItems = [...this.allMenuItems];

    if (this.authenticatedClient) {
      if (isPartnerRole(this.authenticatedClient.role)) {
        filteredItems = filteredItems.filter((item) =>
          ClientMenuSideComponent.PARTNER_MENU_IDS.has(item.id)
        );
      } else {
        filteredItems = filteredItems.filter(
          (item) => !ClientMenuSideComponent.PARTNER_ONLY_MENU_IDS.has(item.id)
        );
      }

      if (isPrivilegedPanelRole(this.authenticatedClient.role)) {
        filteredItems = filteredItems.filter((item) => item.id !== "wishList");
      }

      if (
        "hasSubscription" in this.authenticatedClient &&
        this.authenticatedClient.hasSubscription === false
      ) {
        filteredItems = filteredItems.filter((item) => item.id !== "myTelas");
      }

      if (
        "hasSubscription" in this.authenticatedClient &&
        this.authenticatedClient.hasSubscription === false
      ) {
        filteredItems = filteredItems.filter(
          (item) => item.id !== "subscriptions"
        );
      }
    }

    this.menuItems = filteredItems;
  }

  onMenuItemSelected(item: MenuItem): void {
    switch (item.id) {
      case "home":
        this.navegarPaginaInicial();
        break;
      case "partnerScreens":
        this.navegarParaPartnerScreens();
        break;
      case "partnerMap":
        this.navegarParaPartnerMap();
        break;
      case "partnerAds":
        this.navegarParaPartnerAds();
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
  }

  navegarParaMyTelas(): void {
    this.router.navigate(["/client/my-telas"]);
  }

  navegarParaSubscriptions(): void {
    this.router.navigate(["/client/subscriptions"]);
  }

  logout() {
    const config = DialogoUtils.exibirAlerta(
      "Are you sure you want to logout?",
      {
        acaoPrimaria: "Logout",
        acaoPrimariaCallback: () => {
          this.refDialogo?.close();
          this.desconectar();
        },
        acaoSecundaria: "Stay",
        acaoSecundariaCallback: () => {
          this.refDialogo?.close();
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
    if (isPartnerRole(this.authenticatedClient?.role)) {
      this.navegarParaPartnerScreens();
      return;
    }
    this.router.navigate(["/client"]);
  }

  navegarParaPartnerScreens(): void {
    this.router.navigate([PARTNER_PORTAL_ROUTES.screens]);
  }

  navegarParaPartnerMap(): void {
    this.router.navigate([PARTNER_PORTAL_ROUTES.map]);
  }

  navegarParaPartnerAds(): void {
    this.router.navigate([PARTNER_PORTAL_ROUTES.adsReview]);
  }

  navegarParaPerfil(): void {
    this.router.navigate(["/client/profile"]);
  }

  navegarParaAlterarSenha(): void {
    this.router.navigate(["/client/change-password"]);
  }
}

