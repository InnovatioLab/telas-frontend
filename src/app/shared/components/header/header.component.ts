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
import { LeafletMapService } from "@app/core/service/state/leaflet-map.service";
import { LoadingService } from "@app/core/service/state/loading.service";
import { MapPoint } from "@app/core/service/state/map-point.interface";
import { SidebarService } from "@app/core/service/state/sidebar.service";
import { ToastService } from "@app/core/service/state/toast.service";
import { IconsModule } from "@app/shared/icons/icons.module";
import { PrimengModule } from "@app/shared/primeng/primeng.module";
import { filter, Subject, Subscription, takeUntil, timer } from "rxjs";
import { CheckoutListSideBarComponent } from "../checkout-list-side-bar/checkout-list-side-bar.component";

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
  ],
  templateUrl: "./header.component.html",
  styleUrls: ["./header.component.scss"],
})
export class HeaderComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild(CheckoutListSideBarComponent)
  checkoutSidebar: CheckoutListSideBarComponent;
  @Output() monitorsFound = new EventEmitter<MapPoint[]>();

  menuVisible = false;
  searchText: string;
  isMobileMenuOpen = false;
  readonly TEXTO_ACAO = {
    entrar: "Sign In",
    cadastrar: "Sign Up",
  };
  itensCarrinho = signal<number>(0);
  itensSalvos = signal<number>(0);
  isLoggedIn = false;
  isMobile = false;
  menuAberto = false;
  isDarkMode = false;

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
  private monitorSearchSubscription: Subscription;
  private _isSearching = false;
  private cartSubscription: Subscription;

  constructor(
    public router: Router,
    private readonly authentication: Authentication,
    private readonly googleMapsService: GoogleMapsService,
    private readonly searchMonitorsService: SearchMonitorsService,
    private readonly sidebarService: SidebarService,
    private readonly cdr: ChangeDetectorRef,
    private readonly toastService: ToastService,
    private readonly loadingService: LoadingService,
    private readonly zipcodeService: ZipCodeService,
    private readonly cartService: CartService,
    private readonly leafletMapService: LeafletMapService
  ) {}

  ngOnInit() {
    this.isLoggedIn = this.authentication.isTokenValido();

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

    // 

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

  searchAddress(): void {
    const searchTextCopy = this.searchText.trim();
    if (!searchTextCopy) return;

    // Validar que seja apenas um zipCode de 5 dígitos
    const zipRegex = /^\d{5}$/;
    this.loadingService.setLoading(true, "address-search");

    if (zipRegex.test(searchTextCopy)) {
      this.searchMonitorsService.findNearestMonitors(searchTextCopy).subscribe({
        next: (monitors) => {
          this.loadingService.setLoading(false, "address-search");

          if (monitors && monitors.length > 0) {
            const mapPoints = this.convertMonitorsToMapPoints(monitors);
            this.leafletMapService.plotNewMonitors(mapPoints);
            this.toastService.sucesso(
              `Found ${monitors.length} monitors near ZIP code ${searchTextCopy}`
            );
            this.searchText = "";
          } else {
            this.toastService.aviso("No monitors found in this region");
          }
        },
        error: (error) => {
          this.loadingService.setLoading(false, "address-search");
          console.error("Error searching monitors:", error);
          this.toastService.erro(
            `Error searching monitors with ZIP code ${searchTextCopy}`
          );
        },
      });
    } else {
      this.loadingService.setLoading(false, "address-search");
      this.toastService.erro("Please enter a valid 5-digit ZIP code");
    }
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
        this.googleMapsService.isSearching$.subscribe(
          (isSearching) => (this._isSearching = isSearching)
        )
      );

      this.searchSubscriptions.add(
        this.googleMapsService.searchError$.subscribe((error) => {
          if (error) {
            this.toastService.erro(error);
          }
        })
      );

      this.searchSubscriptions.add(
        this.googleMapsService.searchResult$.subscribe((result) => {
          if (result) {
            this.toastService.sucesso(
              `Address found: ${result.formattedAddress}`
            );
            this.searchText = "";

            this.searchMonitorsService
              .searchNearestMonitorsByAddress(
                result.formattedAddress,
                this.googleMapsService
              )
              .then((monitors) => {
                if (monitors && monitors.length > 0) {
                  this.monitorsFound.emit(monitors);
                  this.toastService.sucesso(
                    `Found ${monitors.length} monitors near this address`
                  );
                } else {
                  this.toastService.info("No monitors found near this address");
                }
              });
          }
        })
      );
    }

    if (this.monitorSearchSubscription) {
      this.monitorSearchSubscription.unsubscribe();
    }

    this.monitorSearchSubscription =
      this.searchMonitorsService.error$.subscribe((error) => {
        if (error) {
          this.toastService.erro(error);
        }
      });
  }

  private convertMonitorsToMapPoints(monitors: any[]): MapPoint[] {
    return monitors.map((monitor) => ({
      id: monitor.id,
      title: `Monitor ${monitor.type} - ${monitor.size}"`,
      description: this.buildMonitorDescription(monitor),
      latitude: monitor.latitude,
      longitude: monitor.longitude,
      type: monitor.type,
      category: "MONITOR",
      addressLocationName: monitor.addressLocationName,
      addressLocationDescription: monitor.addressLocationDescription,
      locationDescription: monitor.monitorLocationDescription,
      hasAvailableSlots: monitor.hasAvailableSlots,
      photoUrl: monitor.photoUrl,
      data: monitor,
    }));
  }

  private buildMonitorDescription(monitor: any): string {
    const parts: string[] = [];

    if (monitor.hasAvailableSlots !== undefined) {
      parts.push(
        `Available Slots: ${monitor.hasAvailableSlots ? "Yes" : "No"}`
      );
    }

    if (monitor.adsDailyDisplayTimeInMinutes) {
      parts.push(
        `Daily Display Time: ${monitor.adsDailyDisplayTimeInMinutes} min`
      );
    }

    if (monitor.estimatedSlotReleaseDate && !monitor.hasAvailableSlots) {
      const releaseDate = new Date(monitor.estimatedSlotReleaseDate);
      parts.push(`Next Available: ${releaseDate.toLocaleDateString()}`);
    }

    return parts.join(" | ") || "Monitor Information";
  }

  private searchMultipleZipCodes(searchTextCopy: string): void {
    // Filtrar apenas números e vírgulas antes de processar
    const cleanedText = searchTextCopy.replace(/[^0-9,]/g, "");

    // Separar por vírgula e limpar espaços
    const zipCodes = cleanedText
      .split(",")
      .map((zip) => zip.trim())
      .filter((zip) => zip.length > 0);

    // Validar que todos os zip codes têm exatamente 5 dígitos
    const zipRegex = /^\d{5}$/;
    const invalidZipCodes: string[] = [];
    const validZipCodes: string[] = [];

    zipCodes.forEach((zipCode) => {
      if (zipRegex.test(zipCode)) {
        validZipCodes.push(zipCode);
      } else if (zipCode.length > 0) {
        invalidZipCodes.push(zipCode);
      }
    });

    // Mostrar erro se há zip codes inválidos
    if (invalidZipCodes.length > 0) {
      this.toastService.erro(
        `Invalid ZIP codes (must be exactly 5 digits): ${invalidZipCodes.join(", ")}`
      );
      return;
    }

    if (validZipCodes.length === 0) {
      this.toastService.aviso(
        "Please enter at least one valid ZIP code (5 digits each)"
      );
      return;
    }

    // Buscar monitores para todos os zip codes válidos
    this.loadingService.setLoading(true, "address-search");

    // Array para armazenar todas as promises de busca
    const searchPromises = validZipCodes.map((zipCode) =>
      this.searchMonitorsService
        .findByZipCode(zipCode)
        .then((monitors) => ({ zipCode, monitors }))
        .catch((error) => {
          console.error(`Error searching monitors for ZIP ${zipCode}:`, error);
          return { zipCode, monitors: [] as MapPoint[] };
        })
    );

    // Aguardar todas as buscas terminarem
    Promise.all(searchPromises)
      .then((results) => {
        this.loadingService.setLoading(false, "address-search");

        // Combinar todos os monitores encontrados
        const allMonitors: MapPoint[] = [];
        const successfulZipCodes: string[] = [];
        const failedZipCodes: string[] = [];

        results.forEach((result) => {
          if (result.monitors && result.monitors.length > 0) {
            allMonitors.push(...result.monitors);
            successfulZipCodes.push(result.zipCode);
          } else {
            failedZipCodes.push(result.zipCode);
          }
        });

        // Mostrar resultados
        if (allMonitors.length > 0) {
          this.monitorsFound.emit(allMonitors);

          let message = `Found ${allMonitors.length} monitors near ${successfulZipCodes.length} ZIP code(s): ${successfulZipCodes.join(", ")}`;

          if (failedZipCodes.length > 0) {
            message += `. No monitors found for: ${failedZipCodes.join(", ")}`;
          }

          this.toastService.sucesso(message);
          this.searchText = "";
        } else {
          this.toastService.aviso(
            `No monitors found for any of the ZIP codes: ${validZipCodes.join(", ")}`
          );
        }
      })
      .catch((error) => {
        this.loadingService.setLoading(false, "address-search");
        this.toastService.erro(
          `Error searching monitors for multiple ZIP codes`
        );
        console.error("Error in multiple ZIP codes search:", error);
      });
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
    if (this.monitorSearchSubscription) {
      this.monitorSearchSubscription.unsubscribe();
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

  

  abrirCheckout() {
    // Verificar se há itens no carrinho antes de abrir
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

  onInputChange() {
    // Filtrar caracteres inválidos (manter apenas números)
    if (this.searchText) {
      const filteredText = this.searchText.replace(/[^0-9]/g, "");
      if (filteredText !== this.searchText) {
        this.searchText = filteredText;
      }
    }

    if (!this.searchText?.trim() && this.isInAllowedRoutes()) {
      this.googleMapsService.clearCurrentSearch();
    }
  }

  onKeyPress(event: KeyboardEvent): void {
    // Permitir apenas números (0-9)
    const allowedKeys = /[0-9]/;
    const key = event.key;

    // Permitir teclas de controle (backspace, delete, arrow keys, etc.)
    if (
      event.ctrlKey ||
      event.metaKey ||
      key === "Backspace" ||
      key === "Delete" ||
      key === "Tab" ||
      key === "Enter" ||
      key === "ArrowLeft" ||
      key === "ArrowRight" ||
      key === "Home" ||
      key === "End"
    ) {
      return;
    }

    // Bloquear teclas que não são números
    if (!allowedKeys.test(key)) {
      event.preventDefault();
    }
  }

  onPaste(event: ClipboardEvent): void {
    // Interceptar evento de colar
    event.preventDefault();

    const clipboardData = event.clipboardData?.getData("text") || "";

    // Filtrar apenas números
    const filteredText = clipboardData.replace(/[^0-9]/g, "");

    // Atualizar o searchText com o texto filtrado
    if (filteredText) {
      this.searchText = (this.searchText || "") + filteredText;
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

  

  get isSearching(): boolean {
    return this.loadingService.loadingSub.getValue();
  }

  isInAllowedRoutes(): boolean {
    const currentUrl = this.router.url;

    return this.headerAllowedRoutes.some((route) => {
      const exactRoutePattern = new RegExp(`^${route}(\\/)?$`);
      return exactRoutePattern.test(currentUrl);
    });
  }

  private isValidZipCode(zipCode: string): boolean {
    const zipRegex = /^\d{5}$/;
    return zipRegex.test(zipCode);
  }

  onSearch(): void {
    const searchTextCopy = this.searchText.trim();
    if (!searchTextCopy) return;

    if (!this.isInAllowedRoutes()) {
      this.toastService.aviso(
        "Search is only available in the application area"
      );
      return;
    }

    if (this.isValidZipCode(searchTextCopy)) {
      this.zipcodeService.findLocationByZipCode(searchTextCopy).subscribe({
        next: (addressData: any) => {
          if (addressData) {
            this.searchMonitorsService
              .findByZipCode(searchTextCopy)
              .then((monitors: any) => {
                if (monitors && monitors.length > 0) {
                  this.leafletMapService.plotNewMonitors(monitors);
                  this.toastService.sucesso(
                    `Found ${monitors.length} monitors near ZIP code ${searchTextCopy}`
                  );
                } else {
                  this.leafletMapService.plotNewMonitors([]);
                  this.toastService.aviso("No monitors found in this region");
                }
              })
              .catch((error: any) => {
                this.monitorsFound.emit([]);
                this.toastService.aviso("No monitors found in this region");
              });
          } else {
            // Como a nova API só aceita zipCode, vamos usar o searchAddress() que já está adaptado
            this.searchAddress();
          }
        },
        error: (error: any) => {
          // Como a nova API só aceita zipCode, vamos usar o searchAddress() que já está adaptado
          this.searchAddress();
        },
      });
    } else {
      this.toastService.erro("Please enter a valid 5-digit ZIP code");
    }
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
