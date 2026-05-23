import { CommonModule } from "@angular/common";
import { Component, OnInit, computed, inject, signal } from "@angular/core";
import { NavigationEnd, Router, RouterModule } from "@angular/router";
import { filter } from "rxjs/operators";
import { Authentication } from "@app/core/service/auth/autenthication";
import { ContentWrapperComponent } from "@app/shared/components/content-wrapper/content-wrapper.component";
import { HeaderComponent } from "@app/shared/components/header/header.component";
import { MenuComponent } from "@app/shared/components/menu/menu.component";
import { RodapeComponent } from "@app/shared/components/rodape/rodape.component";

interface ToggleAdminSidebarEvent {
  visible: boolean;
}

@Component({
  selector: "app-admin-view-layout",
  standalone: true,
  host: {
    "[class.layout--map-home]": "isAdminMapHome()",
  },
  imports: [
    CommonModule,
    RouterModule,
    HeaderComponent,
    MenuComponent,
    ContentWrapperComponent,
    RodapeComponent,
  ],
  templateUrl: "./admin-view-layout.component.html",
  styleUrls: ["./admin-view-layout.component.scss"],
})
export class AdminViewLayoutComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly url = signal(this.router.url);

  readonly isAdminMapHome = computed(() => {
    const path = this.url().split("?")[0];
    return path === "/admin" || path === "/admin/";
  });

  userName: string = "Administrador";

  constructor(private readonly authentication: Authentication) {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => this.url.set(this.router.url));
  }

  ngOnInit(): void {
    const client = this.authentication._clientSignal();
    if (client) {
      this.userName = client.businessName;
    }
  }

  onAlertSidebarVisibilityChange(isVisible: boolean): void {
    const header = document.querySelector("app-header") as any;
    header?.updateAdminSidebarVisibility?.(isVisible);
  }
}
