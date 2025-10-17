import { NotificationsService } from '@app/core/service/api/notifications.service';
import { CommonModule } from "@angular/common";
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
  signal,
  ViewChild,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { NavigationEnd, Router, RouterModule } from "@angular/router";
import { ShowInRoutesDirective } from "@app/core/directives/show-in-routes.directive";
import { CartService } from "@app/core/service/api/cart.service";
import { GoogleMapsService } from "@app/core/service/api/google-maps.service";
import { SearchMonitorsService } from "@app/core/service/api/search-monitors.service";
import { ZipCodeService } from "@app/core/service/api/zipcode.service";
import { Authentication } from "@app/core/service/auth/autenthication";
import { LoadingService } from "@app/core/service/state/loading.service";
import { MapPoint } from "@app/core/service/state/map-point.interface";
import { SidebarService } from "@app/core/service/state/sidebar.service";
import { ToastService } from "@app/core/service/state/toast.service";
import { NotificationState } from "@app/modules/notificacao/models";
import { IconsModule } from "@app/shared/icons/icons.module";
import { PrimengModule } from "@app/shared/primeng/primeng.module";
import { filter, Subject, Subscription, takeUntil, timer } from "rxjs";
import { AlertCounterComponent } from "../alert-counter/alert-counter.component";
import { CheckoutListSideBarComponent } from "../checkout-list-side-bar/checkout-list-side-bar.component";
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
    AlertCounterComponent,
    ShowInRoutesDirective,
    NotificationSidebarComponent
  ],
  templateUrl: "./header.component.html",
  styleUrls: ["./header.component.scss"],
})
export class HeaderComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild(CheckoutListSideBarComponent)
  checkoutSidebar: CheckoutListSideBarComponent;
  @Output() monitorsFound = new EventEmitter<MapPoint[]>();

  menuVisible = false;
  isMobileMenuOpen = false;
  readonly TEXTO_ACAO = {
    entrar: "Sign In",
    cadastrar: "Sign Up",
  };
  itensCarrinho = signal<number>(0);
  itensNotificacao = signal<number>(0);
  itensSalvos = signal<number>(0);
  isLoggedIn = false;
  isMobile = false;
  menuAberto = false;
  isDarkMode = false;
  isAdminSidebarVisible = false;
    isNotificationsSidebarVisible = false;

  headerAllowedRoutes = ["/client", "/admin"];

  // Getter para verificar se o carrinho tem itens
  get hasActiveCart(): boolean {
    return this.itensCarrinho() > 0;
  }

  // Getter para o tooltip do carrinho
  get cartTooltip(): string {
    return this.hasActiveCart
      ? `View your cart (${this.itensCarrinho()} items)`
      : "Your cart is empty";
  }

  get isMenuOpenInSmallMobile(): boolean {
    const isSmallMobile = window.innerWidth <= 600;
    const isMenuOpen = this.menuAberto;
    return isMenuOpen && isSmallMobile;
  }

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
    private readonly notificationState: NotificationState,
    private readonly googleMapsService: GoogleMapsService,
    private readonly searchMonitorsService: SearchMonitorsService,
    private readonly sidebarService: SidebarService,
    private readonly cdr: ChangeDetectorRef,
    private readonly toastService: ToastService,
    private readonly loadingService: LoadingService,
    private readonly zipcodeService: ZipCodeService,
    private readonly cartService: CartService,
    private readonly notificationsService: NotificationsService
  ) {}

  ngOnInit() {
    this.notificationsService.fetchAllNotifications().subscribe();
    this.isLoggedIn = this.authentication.isTokenValido();

    this.itensNotificacao = this.notificationState._quantidadeNotificacoes;
    this.checkScreenSize();
    this.resizeListener = () => this.checkScreenSize();
    window.addEventListener("resize", this.resizeListener);
    if (this.isLoggedIn) {
      this.initializeUserServices();
    }

    this.authSubscription = this.authentication.isLoggedIn$.subscribe(
      (isLoggedIn) => {
        this.isLoggedIn = isLoggedIn;
        if (isLoggedIn && !this.savedPointsSubscription) {
          this.initializeUserServices();
        }
        this.cdr.detectChanges();
      }
    );

    this.authStateSubscription = this.authentication.authState$.subscribe(
      () => {
        this.isLoggedIn = this.authentication.isLoggedIn$.getValue();
        if (this.isLoggedIn && !this.savedPointsSubscription) {
          this.initializeUserServices();
        }
        this.cdr.detectChanges();
      }
    );

    this.menuSubscription = this.sidebarService.atualizarLista.subscribe(() => {
      const isVisible = this.sidebarService.visibilidade();
      const menuTipo = this.sidebarService.tipo();

      this.menuAberto =
        isVisible && (menuTipo === "client-menu" || menuTipo === "admin-menu");

      // Atualizar isMobileMenuOpen baseado no estado do menu e se está em mobile
      this.isMobileMenuOpen = this.menuAberto && this.isMobile;

      // Forçar detecção de mudança para o getter ser reavaliado
      this.cdr.detectChanges();
    });

    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.isLoggedIn = this.authentication.isTokenValido();
        this.cdr.detectChanges();
      });

    if (this.isAdministrador()) {
      const savedVisibility = localStorage.getItem("admin_sidebar_visible");
      this.isAdminSidebarVisible = savedVisibility === "true";
    }

    window.addEventListener(
      "admin-sidebar-visibility-changed",
      (e: CustomEvent<ToggleAdminSidebarEvent>) => {
        if (e.detail?.visible !== undefined) {
          this.isAdminSidebarVisible = e.detail.visible;
          this.cdr.detectChanges();
        }
      }
    );

    window.addEventListener(
      "admin-sidebar-pin-changed",
      (e: CustomEvent<AdminSidebarPinChangedEvent>) => {
        if (e.detail) {
          this.isAdminSidebarVisible = e.detail.visible;
          this.cdr.detectChanges();
        }
      }
    );

    // Inicializar subscription para mudanças do carrinho
    this.subscribeToCartChanges();

    // Inicializar carrinho apenas se logado (só uma vez na aplicação)
    if (this.isLogado()) {
      this.cartService.initializeCart();
    }
  }

  ngAfterViewInit() {
    timer(0).subscribe(() => {
      this.isLoggedIn = this.authentication.isTokenValido();
      if (this.isLoggedIn && !this.savedPointsSubscription) {
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

    // Inicializar subscription do carrinho
    this.subscribeToCartChanges();

    if (this.isInAllowedRoutes()) {
      this.savedPointsSubscription =
        this.googleMapsService.savedPoints$.subscribe((points) => {
          this.itensSalvos.set(points?.length || 0);
        });


      this.searchSubscriptions.add(
        this.googleMapsService.searchError$.subscribe((error) => {
          if (error) {
            this.toastService.erro(error);
          }
        })
      );

    }

    // Removed search monitors subscription - now handled by SearchSectionComponent
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
    const newIsMobile = window.innerWidth <= 768;
    if (this.isMobile !== newIsMobile) {
      this.isMobile = newIsMobile;
      this.isMobileMenuOpen = this.menuAberto && this.isMobile;
    }
  }

  redirecionarAdministracao() {
    if (this.isAdministrador()) {
      if (this.router.url.includes("/admin/profile")) {
        this.router.navigate(["/admin"]);
      } else {
        this.router.navigate(["/admin/profile"]);
      }
    }
  }

  isAdministrador() {
    return (
      this.isLogado() && this.authentication?._clientSignal()?.role === "ADMIN"
    );
  }

  isLogado() {
    return this.isLoggedIn || this.authentication.isTokenValido();
  }

  redirecionarLogin() {
    this.router.navigate(["/authentication/login"]);
  }

  redirecionarCadastro() {
    this.router.navigate(["/register"]);
  }

  abrirNotificacoes() {
    this.isNotificationsSidebarVisible = true;
  }

  fecharNotificacoes() {
    this.isNotificationsSidebarVisible = false;
  }

  abrirCheckout() {
    if (!this.hasActiveCart) {
      this.toastService.info(
        "Your cart is empty. Add monitors to start shopping."
      );
      return;
    }

    if (this.checkoutSidebar) {
      this.checkoutSidebar.abrirSidebar();
    }
  }

  navegarPaginaInicial() {
    if (this.isLogado()) {
      if (this.isAdministrador()) {
        this.router.navigate(["/admin"]);
      } else {
        this.router.navigate(["/client"]);
      }
    } else {
      this.router.navigate(["/"]);
    }
  }



  toggleMenu(): void {
    if (!this.isLogado()) return;

    const isVisible = this.sidebarService.visibilidade();
    const menuTipo = this.sidebarService.tipo();

    if (
      isVisible &&
      (menuTipo === "client-menu" || menuTipo === "admin-menu")
    ) {
      this.sidebarService.fechar();
    } else {
      const menuType = this.isAdministrador() ? "admin-menu" : "client-menu";
      this.sidebarService.abrirMenu(menuType);
    }
  }

  isProfileManagementRoute(): boolean {
    return this.router.url.includes("/management-profile");
  }

  toggleAdminSidebar(): void {
    this.isAdminSidebarVisible = !this.isAdminSidebarVisible;
    localStorage.setItem(
      "admin_sidebar_visible",
      this.isAdminSidebarVisible.toString()
    );

    const toggleEvent = new CustomEvent<ToggleAdminSidebarEvent>(
      "toggle-admin-sidebar",
      {
        detail: { visible: this.isAdminSidebarVisible },
      }
    );
    window.dispatchEvent(toggleEvent);
  }

  updateAdminSidebarVisibility(isVisible: boolean): void {
    this.isAdminSidebarVisible = isVisible;
  }


  isInAllowedRoutes(): boolean {
    const currentUrl = this.router.url;

    return this.headerAllowedRoutes.some((route) => {
      const exactRoutePattern = new RegExp(`^${route}(\\/)?$`);
      return exactRoutePattern.test(currentUrl);
    });
  }



  private subscribeToCartChanges(): void {
    if (this.isLogado()) {
      // Limpar subscription anterior se existir
      if (this.cartSubscription) {
        this.cartSubscription.unsubscribe();
      }

      this.cartSubscription = this.cartService.cartUpdatedStream$.subscribe({
        next: (cart) => {
          if (cart && cart.items) {
            this.itensCarrinho.set(cart.items.length);
          } else {
            this.itensCarrinho.set(0);
          }
        },
        error: () => {
          this.itensCarrinho.set(0);
        },
      });
    }
  }
}
