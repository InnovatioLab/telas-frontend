import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimengModule } from '@app/shared/primeng/primeng.module';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IconsModule } from '@app/shared/icons/icons.module';
import { AlertCounterComponent } from '../alert-counter/alert-counter.component';
import { ShowInRoutesDirective } from '@app/core/directives/show-in-routes.directive';
import { CheckoutListSideBarComponent } from '../checkout-list-side-bar/checkout-list-side-bar.component';

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

  TEXTO_ACAO = { entrar: 'Sign In', cadastrar: 'Sign Up' };
  menuAberto = false;
  isAdminSidebarVisible = false;
  isSearching = false;
  isMobile = false;
  searchText = '';

  headerAllowedRoutes: string[] = ['/dashboard', '/orders', '/products'];
isDarkMode: any;
isMobileMenuOpen: any;

  constructor(public router: Router) {}

  ngOnInit(): void {}
  ngAfterViewInit(): void {}
  ngOnDestroy(): void {}

  redirecionarLogin() { this.router.navigate(['/login']); }
  redirecionarCadastro() { this.router.navigate(['/register']); }
  navegarPaginaInicial() { this.router.navigate(['/']); }
  abrirNotificacoes() { /* implementar lógica de notificações */ }
  abrirCheckout() { /* implementar lógica de checkout */ }
  redirecionarAdministracao() { this.router.navigate(['/admin']); }
  toggleMenu() { this.menuAberto = !this.menuAberto; }
  toggleAdminSidebar() { this.isAdminSidebarVisible = !this.isAdminSidebarVisible; }
  onInputChange() { }
  searchAddress() { }
  isLogado() { return true; }
  isAdministrador() { return false; }
  isProfileManagementRoute() { return false; }
  itensNotificacao() { return 0; }
  itensSalvos() { return 0; }

  isInAllowedRoutes(): boolean {
    const currentUrl = this.router.url;
    return this.headerAllowedRoutes.some(route => {
      const exactRoutePattern = new RegExp(`^${route}(\/)?$`);
      return exactRoutePattern.test(currentUrl);
    });
  }
}

