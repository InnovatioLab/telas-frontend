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
import { IconsModule } from '@app/shared/icons/icons.module';

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  action?: string;
}

@Component({
  selector: 'app-admin-menu-side',
  standalone: true,
  imports: [
    CommonModule, 
    PrimengModule, 
    DialogModule, 
    ToggleComponent,
    IconsModule,
  ],
  providers: [DialogService, DialogoUtils],
  templateUrl: './admin-menu-side.component.html',
  styleUrls: ['./admin-menu-side.component.scss']
})
export class AdminMenuSideComponent implements OnInit, OnDestroy {
  menuAberto = false;
  menuFixo = false;
  private sidebarSubscription: Subscription;
  refDialogo: DynamicDialogRef | undefined;
  isDarkMode = false;

  menuItems: MenuItem[] = [
    { id: 'home', label: 'Map', icon: 'dashboard' },
    { id: 'monitors', label: 'Monitors', icon: 'tv-display' },
    { id: 'boxes', label: 'Boxes', icon: 'box'},
    { id: 'logout', label: 'Logout', icon: 'sair' },
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
    this.carregarEstadoMenuFixo();
    this.toggleModeService.theme$.subscribe((theme: string) => {
      this.isDarkMode = theme === 'dark';
    });
    this.sidebarSubscription = this.sidebarService.atualizarLista.subscribe(() => {
      const isVisible = this.sidebarService.visibilidade();
      const tipo = this.sidebarService.tipo();
      
      if (!this.menuFixo) {
        if (isVisible && tipo === 'admin-menu' && !this.menuAberto) {
          this.abrirMenu();
        } else if (!isVisible && this.menuAberto) {
          this.fecharMenu();
        }
      }
    });
    
    if (this.menuFixo) {
      this.abrirMenu();
    }
    
    const loadEvent = new CustomEvent('admin-menu-loaded');
    window.dispatchEvent(loadEvent);
  }
  
  ngOnDestroy(): void {
    if (this.sidebarSubscription) {
      this.sidebarSubscription.unsubscribe();
    }
  }

  @HostListener('document:keydown.escape')
  fecharMenuComEsc(): void {
    if (this.menuAberto && !this.menuFixo) {
      this.toggleMenu();
    }
  }

  toggleMenu(): void {
    if (this.menuFixo && this.menuAberto) {
      return;
    }
    
    if (this.menuAberto) {
      this.fecharMenu();
    } else {
      this.abrirMenu();
    }
  }
  
  toggleFixarMenu(event: Event): void {
    event.stopPropagation();
    
    if (window.innerWidth <= 768) {
      return;
    }
    
    this.menuFixo = !this.menuFixo;
    
    this.salvarEstadoMenuFixo();
    
    if (this.menuFixo) {
      this.abrirMenu();
      this.renderer.addClass(document.body, 'menu-fixed');
    } else {
      this.renderer.removeClass(document.body, 'menu-fixed');
      if (!this.menuAberto) {
        this.fecharMenu();
      }
    }
    
    const pinEvent = new CustomEvent('admin-menu-pin-changed', {
      detail: { pinned: this.menuFixo }
    });
    window.dispatchEvent(pinEvent);
    
    this.ajustarEspacoMapa();
  }
  
  private salvarEstadoMenuFixo(): void {
    try {
      localStorage.setItem('adminMenuFixo', this.menuFixo ? 'true' : 'false');
    } catch (e) {
      console.error('Não foi possível salvar o estado do menu:', e);
    }
  }
  
  private carregarEstadoMenuFixo(): void {
    try {
      const estadoSalvo = localStorage.getItem('adminMenuFixo');
      if (estadoSalvo !== null) {
        if (window.innerWidth <= 768) {
          this.menuFixo = false;
          localStorage.setItem('adminMenuFixo', 'false');
        } else {
          this.menuFixo = estadoSalvo === 'true';
          
          if (this.menuFixo) {
            this.renderer.addClass(document.body, 'menu-fixed');
          }
        }
      }
    } catch (e) {
      console.error('Não foi possível carregar o estado do menu:', e);
    }
  }
  
  private abrirMenu(): void {
    this.menuAberto = true;
    this.sidebarService.abrirMenu('admin-menu');
    
    this.renderer.addClass(document.body, 'menu-open');
    
    setTimeout(() => {
      const primeiroItem = this.elementRef.nativeElement.querySelector('.menu-item');
      if (primeiroItem) {
        primeiroItem.focus();
      }
    }, 100);
    
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 300);
  }
  
  private fecharMenu(): void {
    if (this.menuFixo) {
      return;
    }
    
    this.menuAberto = false;
    this.sidebarService.fechar();
    
    this.renderer.removeClass(document.body, 'menu-open');
    
    const closeEvent = new CustomEvent('admin-menu-closed');
    window.dispatchEvent(closeEvent);
    
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 300);
  }

  selecionarOpcao(item: MenuItem): void {
    switch (item.id) {
      case 'home':
        this.navegarPaginaInicial();
        break;
      case 'users':
        this.navegarParaUsers();
        break;
      case 'monitors':
        this.navegarParaMonitores();
        break;
      case 'boxes':
        this.navegarParaBoxes();
        break;
      case 'alerts':
        this.toggleAdminSidebar();
        break;
      case 'settings':
        this.navegarParaConfiguracoes();
        break;
      case 'help':
        this.abrirHelp();
        break;
      case 'logout':
        this.logout();
        break;
      default:
        break;
    }
  }

  navegarParaUsers(): void {
    this.router.navigate(['/admin/users']);
    if (this.menuAberto && !this.menuFixo) {
      this.toggleMenu();
    }
  }

  navegarParaConfiguracoes(): void {
    this.router.navigate(['/admin/settings']);
    if (this.menuAberto && !this.menuFixo) {
      this.toggleMenu();
    }
  }

  navegarParaMonitores(): void {
    this.router.navigate(['/admin/monitors']);
    if (this.menuAberto && !this.menuFixo) {
      this.toggleMenu();
    }
  }

  navegarParaBoxes(): void {
    this.router.navigate(['/admin/boxes']);
    if (this.menuAberto && !this.menuFixo) {
      this.toggleMenu();
    }
  }

  toggleAdminSidebar(): void {
    const event = new CustomEvent('toggle-admin-sidebar', {
      detail: { visible: true }
    });
    window.dispatchEvent(event);
    
    if (this.menuAberto && !this.menuFixo) {
      this.toggleMenu();
    }
  }

  abrirHelp(): void {
    if (this.menuAberto && !this.menuFixo) {
      this.toggleMenu();
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

  navegarPaginaInicial(): void {
    this.router.navigate(['/admin']);
    
    if (this.menuAberto && !this.menuFixo) {
      this.toggleMenu();
    }
  }

  private ajustarEspacoMapa(): void {
    if (this.menuAberto) {
      this.renderer.addClass(document.body, 'menu-open');
      if (this.menuFixo) {
        this.renderer.addClass(document.body, 'menu-fixed');
      }
    } else {
      this.renderer.removeClass(document.body, 'menu-open');
      this.renderer.removeClass(document.body, 'menu-fixed');
    }
    
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 300);
  }

  getMenuItemTooltip(item: MenuItem): string {
    switch (item.id) {
      case 'home':
        return 'Go to dashboard';
      case 'users':
        return 'Manage system users';
      case 'monitors':
        return 'View system monitors';
      case 'boxes':
        return 'Manage system boxes';
      case 'alerts':
        return 'View system alerts';
      case 'settings':
        return 'Configure system settings';
      case 'help':
        return 'Get help and support';
      case 'logout':
        return 'Sign out from your account';
      default:
        return item.label;
    }
  }
}
