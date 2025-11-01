import { CommonModule } from "@angular/common";
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { NavigationEnd, Router, RouterModule } from "@angular/router";
import { ShowInRoutesDirective } from "@app/core/directives/show-in-routes.directive";
import { GoogleMapsService } from "@app/core/service/api/google-maps.service";
import { NotificationsService } from "@app/core/service/api/notifications.service";
import { Authentication } from "@app/core/service/auth/autenthication";
import { MapPoint } from "@app/core/service/state/map-point.interface";
import { SidebarService } from "@app/core/service/state/sidebar.service";
import { ToastService } from "@app/core/service/state/toast.service";
import { ToggleModeService } from "@app/core/service/state/toggle-mode.service";
import { IconsModule } from "@app/shared/icons/icons.module";
import { PrimengModule } from "@app/shared/primeng/primeng.module";
import { HeaderActionsService } from "@app/shared/services/header-actions.service";
import { HeaderStateService } from "@app/shared/services/header-state.service";
import { filter, Subject, Subscription, takeUntil, timer } from "rxjs";
import { CheckoutListSideBarComponent } from "../checkout-list-side-bar/checkout-list-side-bar.component";
import { HeaderActionsComponent } from "../header-actions/header-actions.component";
import { HeaderBrandComponent } from "../header-brand/header-brand.component";
import { HeaderNavigationComponent } from "../header-navigation/header-navigation.component";
import { NotificationSidebarComponent } from "../notification-sidebar/notification-sidebar.component";

interface ToggleAdminSidebarEvent {
  visible: boolean;
}

interface AdminSidebarPinChangedEvent {
  pinned: boolean;
  visible: boolean;
}

@Component({
  selector: "app-header",
  standalone: true,
  imports: [
    CommonModule,
    PrimengModule,
    RouterModule,
    CheckoutListSideBarComponent,
    FormsModule,
    IconsModule,
    ShowInRoutesDirective,
    NotificationSidebarComponent,
    HeaderBrandComponent,
    HeaderNavigationComponent,
    HeaderActionsComponent,
  ],
  templateUrl: "./header.component.html",
  styleUrls: ["./header.component.scss"],
})
export class HeaderComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild(CheckoutListSideBarComponent)
  checkoutSidebar: CheckoutListSideBarComponent;
  @Output() monitorsFound = new EventEmitter<MapPoint[]>();

  readonly TEXTO_ACAO = {
    entrar: "Sign In",
    cadastrar: "Sign Up",
  };

  headerAllowedRoutes = ["/client", "/admin"];

  private resizeListener: () => void;
  private authSubscription: Subscription;
  private authStateSubscription: Subscription;
  private savedPointsSubscription: Subscription;
  private menuSubscription: Subscription;
  private readonly searchSubscriptions = new Subscription();
  private readonly destroy$ = new Subject<void>();
  private cartSubscription: Subscription;

  constructor(
    public router: Router,
    private readonly authentication: Authentication,
    private readonly googleMapsService: GoogleMapsService,
    private readonly sidebarService: SidebarService,
    private readonly cdr: ChangeDetectorRef,
    private readonly toastService: ToastService,
    private readonly notificationsService: NotificationsService,
    private readonly toggleModeService: ToggleModeService,
    public readonly headerState: HeaderStateService,
    public readonly headerActions: HeaderActionsService
  ) {}

  ngOnInit() {
    this.notificationsService.fetchAllNotifications().subscribe();

    this.checkScreenSize();
    this.resizeListener = () => this.checkScreenSize();
    window.addEventListener("resize", this.resizeListener);

    if (this.headerActions.isLoggedIn()) {
      this.initializeUserServices();
    }

    this.setupSubscriptions();
  }

  private setupSubscriptions(): void {
    // Auth subscriptions
    this.authSubscription = this.authentication.isLoggedIn$.subscribe(
      (isLoggedIn) => {
        if (isLoggedIn && !this.savedPointsSubscription) {
          this.initializeUserServices();
        }
        this.cdr.detectChanges();
      }
    );

    this.authStateSubscription = this.authentication.authState$.subscribe(
      () => {
        if (this.headerActions.isLoggedIn() && !this.savedPointsSubscription) {
          this.initializeUserServices();
        }
        this.cdr.detectChanges();
      }
    );

    // Menu subscription
    this.menuSubscription = this.sidebarService.atualizarLista.subscribe(() => {
      const isVisible = this.sidebarService.visibilidade();
      const menuTipo = this.sidebarService.tipo();

      const menuAberto =
        isVisible && (menuTipo === "client-menu" || menuTipo === "admin-menu");
      this.headerState.setMenuOpen(menuAberto);
      this.headerState.setMobileMenuOpen(
        menuAberto && this.headerState.isMobile()
      );

      this.cdr.detectChanges();
    });

    // Router events
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.cdr.detectChanges();
      });

    // Theme subscription
    this.toggleModeService.theme$.subscribe((theme: string) => {
      this.headerState.setDarkMode(theme === "dark");
      this.cdr.detectChanges();
    });
  }

  ngAfterViewInit() {
    timer(0).subscribe(() => {
      if (this.headerActions.isLoggedIn() && !this.savedPointsSubscription) {
        this.initializeUserServices();
      }
      this.cdr.detectChanges();
    });
  }

  private initializeUserServices() {
    if (this.isInAllowedRoutes()) {
      this.googleMapsService.initGoogleMapsApi();
      this.googleMapsService.initSavedPoints();
    }

    if (this.savedPointsSubscription) {
      this.savedPointsSubscription.unsubscribe();
    }

    if (this.isInAllowedRoutes()) {
      this.savedPointsSubscription =
        this.googleMapsService.savedPoints$.subscribe((points) => {
          this.headerActions.updateSavedItemsCount(points?.length || 0);
        });

      this.searchSubscriptions.add(
        this.googleMapsService.searchError$.subscribe((error) => {
          if (error) {
            this.toastService.erro(error);
          }
        })
      );
    }
  }

  ngOnDestroy() {
    if (this.resizeListener) {
      window.removeEventListener("resize", this.resizeListener);
    }
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
    if (this.authStateSubscription) {
      this.authStateSubscription.unsubscribe();
    }
    if (this.savedPointsSubscription) {
      this.savedPointsSubscription.unsubscribe();
    }
    if (this.menuSubscription) {
      this.menuSubscription.unsubscribe();
    }
    if (this.searchSubscriptions) {
      this.searchSubscriptions.unsubscribe();
    }
    if (this.cartSubscription) {
      this.cartSubscription.unsubscribe();
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  private checkScreenSize() {
    this.headerState.updateScreenSize();
  }

  // Event handlers for child components
  onLogoClick(): void {
    this.headerActions.navigateToHome();
  }

  onMenuToggle(): void {
    if (!this.headerActions.isLoggedIn()) return;

    const isVisible = this.sidebarService.visibilidade();
    const menuTipo = this.sidebarService.tipo();

    if (
      isVisible &&
      (menuTipo === "client-menu" || menuTipo === "admin-menu")
    ) {
      this.sidebarService.fechar();
    } else {
      const menuType = this.headerActions.isAdministrator()
        ? "admin-menu"
        : "client-menu";
      this.sidebarService.abrirMenu(menuType);
    }
  }

  onCheckoutClick(): void {
    this.headerActions.openCheckout();
    if (this.checkoutSidebar) {
      this.checkoutSidebar.abrirSidebar();
    }
  }

  onAdminClick(): void {
    this.headerActions.navigateToAdminProfile();
  }

  onNotificationsClick(): void {
    this.headerState.toggleNotificationsSidebar();
  }

  onNotificationsVisibilityChange(visible: boolean): void {
    this.headerState.setNotificationsSidebarVisible(visible);
  }

  // Legacy methods for backward compatibility
  redirecionarAdministracao() {
    this.headerActions.navigateToAdminProfile();
  }

  isAdministrador() {
    return this.headerActions.isAdministrator();
  }

  isLogado() {
    return this.headerActions.isLoggedIn();
  }

  redirecionarLogin() {
    this.headerActions.navigateToLogin();
  }

  redirecionarCadastro() {
    this.headerActions.navigateToRegister();
  }

  abrirNotificacoes() {
    this.headerState.toggleNotificationsSidebar();
  }

  fecharNotificacoes() {
    this.headerState.setNotificationsSidebarVisible(false);
  }

  abrirCheckout() {
    this.onCheckoutClick();
  }

  navegarPaginaInicial() {
    this.headerActions.navigateToHome();
  }

  toggleMenu(): void {
    this.onMenuToggle();
  }

  isProfileManagementRoute(): boolean {
    return this.router.url.includes("/management-profile");
  }

  toggleAdminSidebar(): void {
    this.headerState.toggleAdminSidebar();
  }

  updateAdminSidebarVisibility(isVisible: boolean): void {
    this.headerState.setAdminSidebarVisible(isVisible);
  }

  isInAllowedRoutes(): boolean {
    const currentUrl = this.router.url;
    return this.headerAllowedRoutes.some((route) => {
      const exactRoutePattern = new RegExp(`^${route}(\\/)?$`);
      return exactRoutePattern.test(currentUrl);
    });
  }

  // Getters for template compatibility
  get isLoggedIn(): boolean {
    return this.headerActions.isLoggedIn();
  }

  get isMobile(): boolean {
    return this.headerState.isMobile();
  }

  get menuAberto(): boolean {
    return this.headerState.isMenuOpen();
  }

  get isDarkMode(): boolean {
    return this.headerState.isDarkMode();
  }

  get isAdminSidebarVisible(): boolean {
    return this.headerState.isAdminSidebarVisible();
  }

  get isNotificationsSidebarVisible(): boolean {
    return this.headerState.isNotificationsSidebarVisible();
  }

  get isMobileMenuOpen(): boolean {
    return this.headerState.isMobileMenuOpen();
  }

  get itensCarrinho(): any {
    return {
      set: (value: number) => this.headerActions.updateCartItemCount(value),
      get: () => this.headerActions.cartItemCount(),
    };
  }

  get itensNotificacao(): any {
    return {
      set: (value: number) => this.headerActions.updateNotificationCount(value),
      get: () => this.headerActions.notificationCount(),
    };
  }

  get itensSalvos(): any {
    return {
      set: (value: number) => this.headerActions.updateSavedItemsCount(value),
      get: () => this.headerActions.savedItemsCount(),
    };
  }

  get hasActiveCart(): boolean {
    return this.headerActions.hasActiveCart();
  }

  get cartTooltip(): string {
    return this.headerActions.getCartTooltip();
  }

  get isMenuOpenInSmallMobile(): boolean {
    const isSmallMobile = window.innerWidth <= 600;
    const isMenuOpen = this.menuAberto;
    return isMenuOpen && isSmallMobile;
  }
}
