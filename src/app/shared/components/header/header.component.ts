import { Component, signal, OnInit, OnDestroy, ChangeDetectorRef, ViewChild, AfterViewInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { LoadingService } from '@app/core/service/state/loading.service';
import { ZipCodeService } from '@app/core/service/api/zipcode.service';
import { AlertCounterComponent } from '../alert-counter/alert-counter.component';
import { IconsModule } from '@app/shared/icons/icons.module';
import { ShowInRoutesDirective } from '@app/core/directives/show-in-routes.directive';

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

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule, 
    PrimengModule, 
    RouterModule, 
    CheckoutListSideBarComponent, 
    FormsModule,
    IconsModule,
    AlertCounterComponent,
    ShowInRoutesDirective
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild(CheckoutListSideBarComponent) checkoutSidebar: CheckoutListSideBarComponent;
  @Output() monitorsFound = new EventEmitter<MapPoint[]>();
  
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
  isDarkMode = false;
  isAdminSidebarVisible = false;
  
  headerAllowedRoutes = ['/client', '/admin'];
  
  private resizeListener: () => void;
  private authSubscription: Subscription;
  private authStateSubscription: Subscription;
  private savedPointsSubscription: Subscription;
  private menuSubscription: Subscription;
  private readonly searchSubscriptions = new Subscription();
  private readonly destroy$ = new Subject<void>();
  private monitorSearchSubscription: Subscription;
  private _isSearching = false;

  constructor(
    public router: Router,
    private readonly authentication: Authentication,
    private readonly notificacaoState: NotificacaoState,
    private readonly googleMapsService: GoogleMapsService,
    private readonly searchMonitorsService: SearchMonitorsService,
    private readonly sidebarService: SidebarService,
    private readonly cdr: ChangeDetectorRef,
    private readonly toggleModeService: ToggleModeService,
    private readonly toastService: ToastService,
    private readonly loadingService: LoadingService,
    private readonly zipcodeService: ZipCodeService,
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
      if (e.detail?.visible !== undefined) {
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
    const searchTextCopy = this.searchText.trim();
    if (!searchTextCopy) return;

    const zipRegex = /^\d{5}(-\d{4})?$/;
    this.loadingService.setLoading(true, 'address-search');
    if (zipRegex.test(searchTextCopy)) {
      const zipCode = searchTextCopy.split('-')[0];
      this.searchMonitorsService.findNearestMonitors(zipCode, undefined, undefined, 3)
        .subscribe({
          next: (response) => {
            this.loadingService.setLoading(false, 'address-search');
            let monitors: MapPoint[] = [];
            if (response && Object.keys(response).length > 0) {
              Object.keys(response).forEach(zipCodeKey => {
                const monitorsInZip = response[zipCodeKey];
                if (Array.isArray(monitorsInZip)) {
                  monitorsInZip.forEach(monitor => {
                    const mapPoint: MapPoint = {
                      id: monitor.id,
                      title: `Monitor ${monitor.type} - ${monitor.size}"`,
                      description: `Distance: ${monitor.distanceInKm.toFixed(2)} km`,
                      latitude: monitor.latitude,
                      longitude: monitor.longitude,
                      type: monitor.type,
                      category: 'MONITOR',
                      data: monitor
                    };
                    monitors.push(mapPoint);
                  });
                }
              });
            }
            if (monitors.length > 0) {
              this.emitMonitorsFoundEvent(monitors);
              this.toastService.sucesso(`Found ${monitors.length} monitors near ZIP code ${zipCode}`);
              this.searchText = '';
            } else {
              console.log('No monitors found! Disparando toast...');
              this.toastService.aviso('No monitors found in this region');
            }
          },
          error: (error) => {
            this.loadingService.setLoading(false, 'address-search');
            console.error('Error searching monitors:', error);
            this.toastService.erro(`Error searching monitors with ZIP code ${zipCode}`);
          }
        });
    } else {
      this.zipcodeService.findLocationByZipCode(searchTextCopy)
        .subscribe({
          next: (addressData) => {
            if (addressData) {
              this.toastService.sucesso(`Location found: ${addressData.city}, ${addressData.state}`);
              this.searchText = '';
              this.searchMonitorsService.findByZipCode(addressData.zipCode || searchTextCopy)
                .then(monitors => {
                  if (monitors && monitors.length > 0) {
                    this.emitMonitorsFoundEvent(monitors);
                    this.toastService.sucesso(`Found ${monitors.length} monitors near ZIP code ${addressData.zipCode || searchTextCopy}`);
                  } else {
                    this.toastService.aviso('No monitors found in this region');
                  }
                })
                .catch(error => {
                  this.toastService.erro(`Error searching monitors with ZIP code ${addressData.zipCode || searchTextCopy}`);
                });
            } else {
              this.toastService.erro('Address not found');
            }
            this.loadingService.setLoading(false, 'address-search');
          },
          error: (error) => {
            this.loadingService.setLoading(false, 'address-search');
            this.toastService.aviso('Error searching address');
          }
        });
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
    
    if (this.isInAllowedRoutes()) {
      this.savedPointsSubscription = this.googleMapsService.savedPoints$.subscribe(points => {
        this.itensSalvos.set(points?.length || 0);
      });
      
      this.searchSubscriptions.add(
        this.googleMapsService.isSearching$.subscribe(
          isSearching => this._isSearching = isSearching
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
    }
    
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
      if (this.router.url.includes('/admin/profile')) {
        this.router.navigate(['/admin']);
      } else {
        this.router.navigate(['/admin/profile']);
      }
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
        this.router.navigate(['/admin']);
      } else {
        this.router.navigate(['/client']);
      }
    } else {
      this.router.navigate(['/']);
    }
  }
  
  onInputChange() {
    if (!this.searchText?.trim() && this.isInAllowedRoutes()) {
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

  get isSearching(): boolean {
    return this.loadingService.loadingSub.getValue();
  }

  isInAllowedRoutes(): boolean {
    const currentUrl = this.router.url;
    
    return this.headerAllowedRoutes.some(route => {
      const exactRoutePattern = new RegExp(`^${route}(\\/)?$`);
      return exactRoutePattern.test(currentUrl);
    });
  }

  private isValidZipCode(zipCode: string): boolean {
    const zipRegex = /^\d{5}(-\d{4})?$/;
    return zipRegex.test(zipCode);
  }

  onSearch(): void {
    const searchTextCopy = this.searchText.trim();
    if (!searchTextCopy) return;

    if (!this.isInAllowedRoutes()) {
      this.toastService.aviso('Search is only available in the application area');
      return;
    }

    const zipCode = searchTextCopy.split('-')[0];
    
    if (this.isValidZipCode(zipCode)) {
      this.zipcodeService.findLocationByZipCode(zipCode).subscribe({
        next: (addressData: any) => {
          if (addressData) {
            this.searchMonitorsService.findByZipCode(zipCode).then((monitors: any) => {
              if (monitors && monitors.length > 0) {
                this.monitorsFound.emit(monitors);
                this.toastService.sucesso(`Found ${monitors.length} monitors near ZIP code ${zipCode}`);
              } else {
                this.monitorsFound.emit([]);
                this.toastService.aviso('No monitors found in this region');
              }
            }).catch((error: any) => {
              this.monitorsFound.emit([]);
              this.toastService.aviso('No monitors found in this region');
            });
          } else {
            this.googleMapsService.geocodeAddress(searchTextCopy).then((result: any) => {
              this.searchMonitorsService.findNearestMonitors(
                result.latitude,
                result.longitude
              ).subscribe({
                next: (monitors: any) => {
                  if (monitors && monitors.length > 0) {
                    this.monitorsFound.emit(monitors);
                    this.toastService.sucesso(`Found ${monitors.length} monitors near this address`);
                  } else {
                    this.monitorsFound.emit([]);
                    this.toastService.aviso('No monitors found in this region');
                  }
                },
                error: (error: any) => {
                  this.monitorsFound.emit([]);
                  this.toastService.aviso('No monitors found in this region');
                }
              });
            }).catch((error: any) => {
              this.monitorsFound.emit([]);
              this.toastService.aviso('No monitors found in this region');
            });
          }
        },
        error: (error: any) => {
          this.googleMapsService.geocodeAddress(searchTextCopy).then((result: any) => {
            this.searchMonitorsService.findNearestMonitors(
              result.latitude,
              result.longitude
            ).subscribe({
              next: (monitors: any) => {
                if (monitors && monitors.length > 0) {
                  this.monitorsFound.emit(monitors);
                  this.toastService.sucesso(`Found ${monitors.length} monitors near this address`);
                } else {
                  this.monitorsFound.emit([]);
                  this.toastService.aviso('No monitors found in this region');
                }
              },
              error: (error: any) => {
                this.monitorsFound.emit([]);
                this.toastService.aviso('No monitors found in this region');
              }
            });
          }).catch((error: any) => {
            this.monitorsFound.emit([]);
            this.toastService.aviso('No monitors found in this region');
          });
        }
      });
    } else {
      this.googleMapsService.geocodeAddress(searchTextCopy).then((result: any) => {
        this.searchMonitorsService.findNearestMonitors(
          result.latitude,
          result.longitude
        ).subscribe({
          next: (monitors: any) => {
            if (monitors && monitors.length > 0) {
              this.monitorsFound.emit(monitors);
              this.toastService.sucesso(`Found ${monitors.length} monitors near this address`);
            } else {
              this.monitorsFound.emit([]);
              this.toastService.aviso('No monitors found in this region');
            }
          },
          error: (error: any) => {
            this.monitorsFound.emit([]);
            this.toastService.aviso('No monitors found in this region');
          }
        });
      }).catch((error: any) => {
        this.monitorsFound.emit([]);
        this.toastService.aviso('No monitors found in this region');
      });
    }
  }
}

