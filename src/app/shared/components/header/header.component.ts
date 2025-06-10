import { CommonModule } from '@angular/common';
import { Component, signal, OnInit, OnDestroy, ChangeDetectorRef, ViewChild, AfterViewInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { PrimengModule } from '@app/shared/primeng/primeng.module';
import { filter, Subject, Subscription, takeUntil, timer } from 'rxjs';
import { Authentication } from '@app/core/service/auth/autenthication';
import { GoogleMapsService } from '@app/core/service/api/google-maps.service';
import { SearchMonitorsService } from '@app/core/service/api/search-monitors.service';
import { SidebarService } from '@app/core/service/state/sidebar.service';
import { ToggleModeService } from '@app/core/service/state/toggle-mode.service';
import { ToastService } from '@app/core/service/state/toast.service';
import { NotificacaoState } from '@app/modules/notificacao/models';
import { MapPoint } from '@app/core/service/state/map-point.interface';
import { CheckoutListSideBarComponent } from '../checkout-list-side-bar/checkout-list-side-bar.component';
import { IconShoppingBasketComponent } from '../../icons/shopping-basket.icon';
import { IconNotificationsComponent } from '../../icons/notifications.icon';
import { IconBarsComponent } from '../../icons/bars.icon';
import { IconSearchComponent } from '../../icons/search.icon';
import { IconSettingsComponent } from '../../icons/settings.icon';
import { IconWarningComponent } from '../../icons/warning.icon';

interface ToggleAdminSidebarEvent {
  visible: boolean;
}

interface AdminSidebarPinChangedEvent {
  pinned: boolean;
  visible: boolean;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule, 
    PrimengModule, 
    RouterModule, 
    CheckoutListSideBarComponent, 
    FormsModule,
    IconShoppingBasketComponent,
    IconNotificationsComponent,
    IconBarsComponent,
    IconSearchComponent,
    IconSettingsComponent,
    IconWarningComponent
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild(CheckoutListSideBarComponent) checkoutSidebar: CheckoutListSideBarComponent;
  
  menuVisible = false;
  searchText: string;
  isMobileMenuOpen = false;
  readonly TEXTO_ACAO = {
    entrar: 'Sign In',
    cadastrar: 'Sign Up'
  };
  itensCarrinho = signal<number>(0);
  itensNotificacao = signal<number>(0);
  itensSalvos = signal<number>(0);
  isLoggedIn = false;
  isMobile = false;
  menuAberto = false;
  isSearching = false;
  isDarkMode = false;
  isAdminSidebarVisible = false; // Inicializando como falso
  
  private resizeListener: () => void;
  private authSubscription: Subscription;
  private authStateSubscription: Subscription;
  private savedPointsSubscription: Subscription;
  private menuSubscription: Subscription;
  private readonly searchSubscriptions = new Subscription();
  private readonly destroy$ = new Subject<void>();
  private monitorSearchSubscription: Subscription;

  constructor(
    public router: Router,
    private readonly authentication: Authentication,
    private readonly notificacaoState: NotificacaoState,
    private readonly googleMapsService: GoogleMapsService,
    private readonly searchMonitorsService: SearchMonitorsService,
    private readonly sidebarService: SidebarService,
    private readonly cdr: ChangeDetectorRef,
    private readonly toggleModeService: ToggleModeService,
    private readonly toastService: ToastService
  ) {}

  ngOnInit() {
    this.isLoggedIn = this.authentication.isTokenValido();
    
    this.itensNotificacao = this.notificacaoState._quantidadeNotificacoes;
    this.checkScreenSize();
    this.resizeListener = () => this.checkScreenSize();
    window.addEventListener('resize', this.resizeListener);
    if (this.isLoggedIn) {
      this.initializeUserServices();
    }

    this.authSubscription = this.authentication.isLoggedIn$.subscribe(isLoggedIn => {
      this.isLoggedIn = isLoggedIn;
      if (isLoggedIn && !this.savedPointsSubscription) {
        this.initializeUserServices();
      }
      this.cdr.detectChanges();
    });

    this.authStateSubscription = this.authentication.authState$.subscribe(() => {
      this.isLoggedIn = this.authentication.isLoggedIn$.getValue();
      if (this.isLoggedIn && !this.savedPointsSubscription) {
        this.initializeUserServices();
      }
      this.cdr.detectChanges();
    });
    
    this.menuSubscription = this.sidebarService.atualizarLista.subscribe(() => {
      this.menuAberto = this.sidebarService.visibilidade() && 
                       this.sidebarService.tipo() === 'client-menu';
    });
    
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.isLoggedIn = this.authentication.isTokenValido();
        this.cdr.detectChanges();
      });
    
    if (this.isAdministrador()) {
      const savedVisibility = localStorage.getItem('admin_sidebar_visible');
      this.isAdminSidebarVisible = savedVisibility === 'true';
    }
    
    window.addEventListener('admin-sidebar-visibility-changed', (e: CustomEvent<ToggleAdminSidebarEvent>) => {
      if (e.detail && e.detail.visible !== undefined) {
        this.isAdminSidebarVisible = e.detail.visible;
        this.cdr.detectChanges();
      }
    });
    
    window.addEventListener('admin-sidebar-pin-changed', (e: CustomEvent<AdminSidebarPinChangedEvent>) => {
      if (e.detail) {
        this.isAdminSidebarVisible = e.detail.visible;
        this.cdr.detectChanges();
      }
    });
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
    if (!this.searchText?.trim()) return;
    
    const searchTextCopy = this.searchText.trim();
    const zipRegex = /^\d{5}(-\d{4})?$/;
    
    if (zipRegex.test(searchTextCopy)) {
      this.searchMonitorsService.findByZipCode(searchTextCopy)
        .then(monitors => {
          if (monitors && monitors.length > 0) {
            this.emitMonitorsFoundEvent(monitors);
            this.toastService.sucesso(`Found ${monitors.length} monitors near ZIP code ${searchTextCopy}`);
          } else {
            this.toastService.aviso(`No monitors found for ZIP code ${searchTextCopy}`);
          }
          this.searchText = ''; 
        })
        .catch(error => {
          console.error('Erro ao buscar monitores por CEP:', error);
          this.toastService.erro(`Error searching for monitors with ZIP code ${searchTextCopy}`);
        });
    } else {
      this.googleMapsService.performAddressSearch(searchTextCopy);
      this.searchText = '';
    }
  }
  
  private initializeUserServices() {
    this.googleMapsService.initGoogleMapsApi();
    this.googleMapsService.initSavedPoints();
    
    if (this.savedPointsSubscription) {
      this.savedPointsSubscription.unsubscribe();
    }
    
    this.savedPointsSubscription = this.googleMapsService.savedPoints$.subscribe(points => {
      this.itensSalvos.set(points?.length || 0);
    });
    
    this.searchSubscriptions.add(
      this.googleMapsService.isSearching$.subscribe(
        isSearching => this.isSearching = isSearching
      )
    );
    
    this.searchSubscriptions.add(
      this.googleMapsService.searchError$.subscribe(
        error => {
          if (error) {
            this.toastService.erro(error);
          }
        }
      )
    );
    
    this.searchSubscriptions.add(
      this.googleMapsService.searchResult$.subscribe(
        result => {
          if (result) {
            this.toastService.sucesso(`Address found: ${result.formattedAddress}`);
            this.searchText = ''; 
            
            this.searchMonitorsService.searchNearestMonitorsByAddress(
              result.formattedAddress,
              this.googleMapsService
            ).then(monitors => {
              if (monitors && monitors.length > 0) {
                this.emitMonitorsFoundEvent(monitors);
                this.toastService.sucesso(`Found ${monitors.length} monitors near this address`);
              } else {
                this.toastService.info('No monitors found near this address');
              }
            });
          }
        }
      )
    );
    
    if (this.monitorSearchSubscription) {
      this.monitorSearchSubscription.unsubscribe();
    }
    
    this.monitorSearchSubscription = this.searchMonitorsService.error$.subscribe(error => {
      if (error) {
        this.toastService.erro(error);
      }
    });
  }
  
  private emitMonitorsFoundEvent(monitors: MapPoint[]): void {
    const event = new CustomEvent('monitors-found', {
      detail: { monitors }
    });
    window.dispatchEvent(event);
  }
  
  ngOnDestroy() {
    if (this.resizeListener) {
      window.removeEventListener('resize', this.resizeListener);
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
    this.destroy$.next();
    this.destroy$.complete();
  }

  private checkScreenSize() {
    const newIsMobile = window.innerWidth <= 768;
    if (this.isMobile !== newIsMobile) {
      this.isMobile = newIsMobile;
    }
  }

  private recriarComponente() {
    this.cdr.detectChanges();
  }

  redirecionarAdministracao() {
    if (this.isAdministrador()) {
      this.router.navigate(['/administrator']);
    }
  }

  isAdministrador() {
    return this.isLogado() && this.authentication?._clientSignal()?.role === 'ADMIN';
  }

  isLogado() {
    return this.isLoggedIn || this.authentication.isTokenValido();
  }

  redirecionarLogin() {
    this.router.navigate(['/authentication/login']);
  }

  redirecionarCadastro() {
    this.router.navigate(['/register']);
  }

  abrirNotificacoes() {
    this.notificacaoState.exibirSidebar();
  }

  abrirCheckout() {
    if (this.checkoutSidebar) {
      this.checkoutSidebar.abrirSidebar();
    }
  }
  
  navegarPaginaInicial() {
    if (this.isLogado()) {
      if (this.isAdministrador()) {
        this.router.navigate(['/administrator']);
      } else {
        this.router.navigate(['/client-view']);
      }
    } else {
      this.router.navigate(['/']);
    }
  }
  
  onInputChange() {
    if (!this.searchText?.trim()) {
      this.googleMapsService.clearCurrentSearch();
    }
  }
  
  toggleMenu(): void {
    if (!this.isLogado()) return;
    
    const isVisible = this.sidebarService.visibilidade();
    const menuTipo = this.sidebarService.tipo();
    
    if (isVisible && (menuTipo === 'client-menu' || menuTipo === 'admin-menu')) {
      this.sidebarService.fechar();
    } else {
      const menuType = this.isAdministrador() ? 'admin-menu' : 'client-menu';
      this.sidebarService.abrirMenu(menuType);
    }
  }
  
  isProfileManagementRoute(): boolean {
    return this.router.url.includes('/management-profile');
  }
  
  toggleAdminSidebar(): void {
    this.isAdminSidebarVisible = !this.isAdminSidebarVisible;
    localStorage.setItem('admin_sidebar_visible', this.isAdminSidebarVisible.toString());
    
    const toggleEvent = new CustomEvent<ToggleAdminSidebarEvent>('toggle-admin-sidebar', {
      detail: { visible: this.isAdminSidebarVisible }
    });
    window.dispatchEvent(toggleEvent);
  }
  
  updateAdminSidebarVisibility(isVisible: boolean): void {
    this.isAdminSidebarVisible = isVisible;
  }
}
