import { Component, HostListener, ElementRef, Renderer2, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimengModule } from '../../primeng/primeng.module';
import { DialogModule } from 'primeng/dialog';
import { ToggleComponent } from '../toogle/toogle.component';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { DialogoUtils } from '@app/shared/utils/dialogo-config.utils';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { Authentication } from '@app/core/service/auth/autenthication';
import { DialogoComponent } from '../dialogo/dialogo.component';
import { SidebarService } from '@app/core/service/state/sidebar.service';
import { AutenticacaoService } from '@app/core/service/api/autenticacao.service';
import { ToggleModeService } from '@app/core/service/state/toggle-mode.service';
import { IconHomeComponent } from '../../icons/home.icon';
import { IconFavoriteComponent } from '../../icons/favorite.icon';
import { IconSettingsComponent } from '../../icons/settings.icon';
import { IconHelpComponent } from '../../icons/help.icon';
import { IconLogoutComponent } from '../../icons/logout.icon';
import { IconCloseComponent } from '../../icons/close.icon';
import { IconPlaceComponent } from '@app/shared/icons/place.icon';

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  action?: string;
}

@Component({
  selector: 'app-client-menu-side',
  standalone: true,
  imports: [
    CommonModule, 
    PrimengModule, 
    DialogModule, 
    ToggleComponent,
    IconHomeComponent,
    IconFavoriteComponent,
    IconSettingsComponent,
    IconHelpComponent,
    IconLogoutComponent,
    IconCloseComponent,
    IconPlaceComponent
  ],
  providers: [DialogService, DialogoUtils],
  templateUrl: './client-menu-side.component.html',
  styleUrls: ['./client-menu-side.component.scss']
})
export class ClientMenuSideComponent implements OnInit, OnDestroy {
  menuAberto = false;
  showPaymentModal = false;
  private sidebarSubscription: Subscription;
  refDialogo: DynamicDialogRef | undefined;
  isDarkMode = false;

  menuItems: MenuItem[] = [
    { id: 'home', label: 'Home', icon: 'pi-home' },
    { id: 'wishList', label: 'Wish list', icon: 'pi-heart' },
    { id: 'myTelas', label: 'My telas', icon: 'pi-map-marker' },
    { id: 'settings', label: 'Settings', icon: 'pi-cog' },
    { id: 'help', label: 'Help', icon: 'pi-question-circle' },
    { id: 'logout', label: 'Logout', icon: 'pi-sign-out' },
  ];

  constructor(
    private readonly sidebarService: SidebarService,
    private readonly elementRef: ElementRef,
    private readonly renderer: Renderer2,
    private readonly router: Router,
    private readonly authentication: Authentication,
    private readonly authenticationService: AutenticacaoService,
    public dialogService: DialogService,
    private readonly toggleModeService: ToggleModeService,
  ) {}

  ngOnInit(): void {
    this.sidebarSubscription = this.sidebarService.atualizarLista.subscribe(() => {
      const isVisible = this.sidebarService.visibilidade();
      const tipo = this.sidebarService.tipo();
      
      if (!this.menuAberto) {
        if (isVisible && tipo === 'client-menu') {
          this.abrirMenu();
        } else if (!isVisible) {
          this.fecharMenu();
        }
      }
    });
  }
  
  ngOnDestroy(): void {
    if (this.sidebarSubscription) {
      this.sidebarSubscription.unsubscribe();
    }
  }

  @HostListener('document:keydown.escape')
  fecharMenuComEsc(): void {
    if (this.menuAberto) {
      this.toggleMenu();
    }
    
    if (this.showPaymentModal) {
      this.showPaymentModal = false;
    }
  }

  toggleMenu(): void {
    if (this.menuAberto) {
      this.fecharMenu();
    } else {
      this.abrirMenu();
    }
  }
  
  // toggleFixarMenu(event: Event): void {
  //   event.stopPropagation();
  //   if (window.innerWidth <= 768) {
  //     return;
  //   }
  //   this.menuFixo = !this.menuFixo;
  //   this.salvarEstadoMenuFixo();
  //   if (this.menuFixo) {
  //     this.abrirMenu();
  //     this.renderer.addClass(document.body, 'menu-fixed');
  //   } else {
  //     this.renderer.removeClass(document.body, 'menu-fixed');
  //   }
  //   this.ajustarEspacoMapa();
  // }
  
  // private salvarEstadoMenuFixo(): void {
  //   try {
  //     localStorage.setItem('menuFixo', this.menuFixo ? 'true' : 'false');
  //   } catch (e) {
  //     console.error('Não foi possível salvar o estado do menu:', e);
  //   }
  // }
  
  // private carregarEstadoMenuFixo(): void {
  //   try {
  //     const estadoSalvo = localStorage.getItem('menuFixo');
  //     if (estadoSalvo !== null) {
  //       if (window.innerWidth <= 768) {
  //         this.menuFixo = false;
  //         localStorage.setItem('menuFixo', 'false');
  //       } else {
  //         this.menuFixo = estadoSalvo === 'true';
  //         if (this.menuFixo) {
  //           this.renderer.addClass(document.body, 'menu-fixed');
  //         }
  //       }
  //     }
  //   } catch (e) {
  //     console.error('Não foi possível carregar o estado do menu:', e);
  //   }
  // }
  
  private abrirMenu(): void {
    this.menuAberto = true;
    this.sidebarService.abrirMenu('client-menu');
    this.renderer.addClass(document.body, 'menu-open');
    this.renderer.addClass(document.body, 'client-menu-active');
    setTimeout(() => {
      const primeiroItem = this.elementRef.nativeElement.querySelector('.menu-item');
      if (primeiroItem) {
        primeiroItem.focus();
      }
    }, 100);
  }
  
  private fecharMenu(): void {
    this.menuAberto = false;
    this.sidebarService.fechar();
    this.renderer.removeClass(document.body, 'menu-open');
    this.renderer.removeClass(document.body, 'client-menu-active');
    setTimeout(() => {
    }, 300);
  }

  selecionarOpcao(item: MenuItem): void {
      switch (item.id) {
      case 'payments':
        this.abrirModalPagamento();
        break;
      case 'home':
        this.navegarPaginaInicial();
        break;
      case 'logout':
        this.logout();
        break;
      case 'settings':
        this.navegarParaConfiguracoes();
        break;
      case 'wishList':
        this.navegarParaWishList();
        break;
      case 'myTelas':
        this.navegarParaMyTelas();
        break;
      default:
        break;
    }
  }

  navegarParaWishList(): void {
    if (this.isLogado()) {
      this.router.navigate(['client/wish-list']);
      if (this.menuAberto) {
        this.toggleMenu();
      }
    } else {
      this.router.navigate(['/login']);
    }
  }

  navegarParaMyTelas(): void {
    if (this.isLogado()) {
      this.router.navigate(['/client/my-telas']);
      if (this.menuAberto) {
        this.toggleMenu();
      }
    } else {
      this.router.navigate(['/login']);
    }
  }

  logout() {
    const config = DialogoUtils.exibirAlerta('Are you sure you want to log out?', {
      acaoPrimaria: 'Yes, log out',
      acaoPrimariaCallback: () => {
        this.refDialogo.close();
        this.desconectar();
      },
      acaoSecundaria: 'No, stay logged in',
      acaoSecundariaCallback: () => {
        this.refDialogo.close();
      }
    });

    this.refDialogo = this.dialogService.open(DialogoComponent, config);
  }

  desconectar() {
    this.authenticationService.logout();
    this.authentication.removerAutenticacao();
    window.location.href = '/';
  }

  abrirModalPagamento(): void {
    if (!this.isLogado()) {
      this.router.navigate(['/login']);
      return;
    }
    this.showPaymentModal = true;
  }

  isLogado(): boolean {
    const token = localStorage.getItem('telas_token');
    const userData = localStorage.getItem('telas_token_user');
    
    return !!token && !!userData;
  }

  navegarPaginaInicial(): void {
    if (this.isLogado()) {
      if (this.isAdministrador()) {
        this.router.navigate(['/administrator']);
      } else {
        this.router.navigate(['/client']);
      }
    } else {
      this.router.navigate(['/']);
    }
    
    if (this.menuAberto) {
      this.toggleMenu();
    }
  }

  isAdministrador(): boolean {
    return this.authentication?._clientSignal()?.role === 'ADMIN';
  }
  
  navegarParaConfiguracoes(): void {
    if (this.isLogado()) {
      this.router.navigate(['/client/settings']);
      if (this.menuAberto) {
        this.toggleMenu();
      }
    } else {
      this.router.navigate(['/login']);
    }
  }

  getMenuItemTooltip(item: MenuItem): string {
    switch (item.id) {
      case 'home':
        return 'Go to home page';
      case 'payments':
        return 'Manage your payments';
      case 'wishList':
        return 'View your saved items';
      case 'map':
        return 'View your ad campaigns';
      case 'settings':
        return 'Change your account settings';
      case 'help':
        return 'Get help and support';
      case 'logout':
        return 'Sign out from your account';
      default:
        return item.label;
    }
  }
  
  getIconComponent(iconName: string): any {
    const iconMap: {[key: string]: any} = {
      'pi-home': IconHomeComponent,
      'pi-heart': IconFavoriteComponent,
      'pi-map-marker': IconPlaceComponent,
      'pi-cog': IconSettingsComponent,
      'pi-question-circle': IconHelpComponent,
      'pi-sign-out': IconLogoutComponent
    };
    
    return iconMap[iconName] ?? null;
  }
}
