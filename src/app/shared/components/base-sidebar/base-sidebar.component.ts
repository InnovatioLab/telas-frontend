import { CommonModule } from "@angular/common";
import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  HostListener,
  Renderer2,
  inject,
} from "@angular/core";
import { Router } from "@angular/router";
import { LayoutService } from "@app/core/service/state/layout.service";
import { SidebarService } from "@app/core/service/state/sidebar.service";
import { PrimengModule } from "../../primeng/primeng.module";
import { ToggleComponent } from "../toogle/toogle.component";
import { IconCloseComponent } from "../../icons/close.icon";
import { IconHomeComponent } from "../../icons/home.icon";
import { IconFavoriteComponent } from "../../icons/favorite.icon";
import { IconPlaceComponent } from "../../icons/place.icon";
import { SubscriptionsIconComponent } from "../../icons/subscriptions.icon";
import { IconSettingsComponent } from "../../icons/settings.icon";
import { IconHelpComponent } from "../../icons/help.icon";
import { IconLogoutComponent } from "../../icons/logout.icon";
import { IconDashboardComponent } from "../../icons/dashboard.icon";
import { IconTvDisplayComponent } from "../../icons/tv-display.icon";
import { IconBoxComponent } from "../../icons/box.icon";
import { IconEtiquetaComponent } from "../../icons/etiqueta.icon";
import { IconUserComponent } from "../../icons/user.icon";
import { Subscription } from "rxjs";

export interface MenuItem {
  id: string;
  label: string;
  icon: string;
  action?: string;
}

@Component({
  selector: "app-base-sidebar",
  standalone: true,
  imports: [
    CommonModule,
    PrimengModule,
    ToggleComponent,
    IconCloseComponent,
    IconHomeComponent,
    IconFavoriteComponent,
    IconPlaceComponent,
    SubscriptionsIconComponent,
    IconSettingsComponent,
    IconHelpComponent,
    IconLogoutComponent,
    IconDashboardComponent,
    IconTvDisplayComponent,
    IconBoxComponent,
    IconEtiquetaComponent,
    IconUserComponent,
  ],
  templateUrl: "./base-sidebar.component.html",
  styleUrls: ["./base-sidebar.component.scss"],
})
export class BaseSidebarComponent implements OnInit, OnDestroy {
  private readonly layoutService = inject(LayoutService);
  private readonly sidebarService = inject(SidebarService);
  private readonly renderer = inject(Renderer2);
  private readonly router = inject(Router);

  @Input() menuItems: MenuItem[] = [];
  @Input() sidebarType: "client-menu" | "admin-menu" = "client-menu";
  @Input() currentUser: any = null;
  @Input() showFooter: boolean = true;
  @Input() version: string = "v1.0.0";

  @Output() menuItemSelected = new EventEmitter<MenuItem>();
  @Output() menuToggled = new EventEmitter<boolean>();

  private sidebarSubscription: Subscription | null = null;
  private layoutSubscription: Subscription | null = null;

  isMenuOpen = this.layoutService.isMenuOpen;
  isMobile = this.layoutService.isMobile;
  isMobileCompact = this.layoutService.isMobileCompact;
  currentSidebarWidth = this.layoutService.currentSidebarWidth;

  ngOnInit(): void {
    this.setupSubscriptions();
  }

  ngOnDestroy(): void {
    if (this.sidebarSubscription) {
      this.sidebarSubscription.unsubscribe();
    }
    if (this.layoutSubscription) {
      this.layoutSubscription.unsubscribe();
    }
  }

  private setupSubscriptions(): void {
    this.sidebarSubscription = this.sidebarService.atualizarLista.subscribe(
      () => {
        const isVisible = this.sidebarService.visibilidade();
        const tipo = this.sidebarService.tipo();

        if (isVisible && tipo === this.sidebarType) {
          if (!this.layoutService.isMenuOpen()) {
            this.layoutService.openMenu(
              this.sidebarType === "client-menu" ? "client" : "admin"
            );
          }
        } else if (!isVisible) {
          if (this.layoutService.isMenuOpen()) {
            this.layoutService.closeMenu();
          }
        }
      }
    );

    this.layoutSubscription = this.layoutService.layoutChange$.subscribe(
      (state) => {
        this.updateBodyClasses(state);
      }
    );
  }

  private updateBodyClasses(state: any): void {
    if (state.menuOpen) {
      this.renderer.addClass(document.body, "menu-open");
      const menuClass =
        this.sidebarType === "client-menu"
          ? "client-menu-active"
          : "admin-menu-active";
      this.renderer.addClass(document.body, menuClass);
    } else {
      this.renderer.removeClass(document.body, "menu-open");
      this.renderer.removeClass(document.body, "client-menu-active");
      this.renderer.removeClass(document.body, "admin-menu-active");
    }
  }

  @HostListener("document:keydown.escape")
  fecharMenuComEsc(): void {
    if (this.isMenuOpen()) {
      this.toggleMenu();
    }
  }

  toggleMenu(): void {
    const isCurrentlyOpen = this.isMenuOpen();

    if (isCurrentlyOpen) {
      this.layoutService.closeMenu();
      this.sidebarService.fechar();
    } else {
      this.layoutService.openMenu(
        this.sidebarType === "client-menu" ? "client" : "admin"
      );
      this.sidebarService.abrirMenu(this.sidebarType);
    }

    this.menuToggled.emit(!isCurrentlyOpen);
  }

  selecionarOpcao(item: MenuItem): void {
    this.menuItemSelected.emit(item);
  }

  getMenuItemTooltip(item: MenuItem): string {
    return item.label;
  }
}

