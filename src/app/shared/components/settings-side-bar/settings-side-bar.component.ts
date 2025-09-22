import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, Renderer2, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { LayoutService } from '@app/core/service/state/layout.service';
import { SidebarService } from '@app/core/service/state/sidebar.service';
import { IconBackComponent } from '@app/shared/icons/back.icon';
import { IconCreditCardComponent } from '@app/shared/icons/credit-card.icon';
import { IconHomeComponent } from '@app/shared/icons/home.icon';
import { IconLockComponent } from '@app/shared/icons/lock.icon';
import { IconPlaceComponent } from '@app/shared/icons/place.icon';
import { Subscription } from 'rxjs';

interface MenuItem {
  id: string;
  label: string;
  route: string;
  icon?: string;
}

@Component({
  selector: 'app-settings-side-bar',
  templateUrl: './settings-side-bar.component.html',
  styleUrls: ['./settings-side-bar.component.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    IconBackComponent,
  ]
})
export class SettingsSideBarComponent implements OnInit, OnDestroy {
  private readonly layoutService = inject(LayoutService);
  private readonly sidebarService = inject(SidebarService);
  private readonly elementRef = inject(ElementRef);
  private readonly renderer = inject(Renderer2);

  // Layout state
  isMenuOpen = this.layoutService.isMenuOpen;
  isMobile = this.layoutService.isMobile;
  isMobileCompact = this.layoutService.isMobileCompact;

  private sidebarSubscription: Subscription;
  private layoutSubscription: Subscription;
  menuItems: MenuItem[] = [
    {
      id: 'profile',
      label: 'Personal Data',
      route: 'profile',
      icon: 'user'
    },
    {
      id: 'password',
      label: 'Change Password',
      route: 'change-password',
      icon: 'key'
    },
    
  ];

  activeMenuItem: string = 'profile';

  constructor(private readonly router: Router) {}

  ngOnInit(): void {
    // Abrir o menu de settings ao entrar na página (desktop)
    if (!this.layoutService.isMenuOpen()) {
      this.layoutService.openMenu('client');
    }
    // Sincronizar com SidebarService usando um tipo dedicado
    this.sidebarService.abrirMenu('settings-menu');

    this.sidebarSubscription = this.sidebarService.atualizarLista.subscribe(() => {
      const isVisible = this.sidebarService.visibilidade();
      const tipo = this.sidebarService.tipo();
      if (tipo === 'settings-menu') {
        if (isVisible && !this.layoutService.isMenuOpen()) {
          this.layoutService.openMenu('client');
        } else if (!isVisible && this.layoutService.isMenuOpen()) {
          this.layoutService.closeMenu();
        }
      }
    });

    this.layoutSubscription = this.layoutService.layoutChange$.subscribe(() => {
      // Apenas para manter coerência visual com body classes se necessário no futuro
      if (this.layoutService.isMenuOpen()) {
        this.renderer.addClass(document.body, 'settings-menu-active');
      } else {
        this.renderer.removeClass(document.body, 'settings-menu-active');
      }
    });
  }

  ngOnDestroy(): void {
    if (this.sidebarSubscription) this.sidebarSubscription.unsubscribe();
    if (this.layoutSubscription) this.layoutSubscription.unsubscribe();
  }

  setActiveMenuItem(menuId: string): void {
    this.activeMenuItem = menuId;
  }

  goBack(): void {
    this.router.navigate(['/client']);
  }

  toggleMenu(): void {
    const isOpen = this.isMenuOpen();
    if (isOpen) {
      this.layoutService.closeMenu();
      this.sidebarService.fechar();
    } else {
      this.layoutService.openMenu('client');
      this.sidebarService.abrirMenu('settings-menu');
    }
  }
  
  getIconComponent(iconName: string): any {
    const iconMap: {[key: string]: any} = {
      'user': IconHomeComponent,
      'key': IconLockComponent,
      'chart': IconPlaceComponent,
      'credit-card': IconCreditCardComponent
    };
    
    return iconMap[iconName] ?? null;
  }
}
