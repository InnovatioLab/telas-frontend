import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { RouterModule } from "@angular/router";
import { Authentication } from "@app/core/service/auth/autenthication";
import { AlertAdminSidebarComponent } from "@app/shared/components/alert-admin-sidebar/alert-admin-sidebar.component";
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
  imports: [
    CommonModule,
    RouterModule,
    HeaderComponent,
    MenuComponent,
    AlertAdminSidebarComponent,
    ContentWrapperComponent,
    RodapeComponent,
  ],
  templateUrl: "./admin-view-layout.component.html",
  styleUrls: ["./admin-view-layout.component.scss"],
})
export class AdminViewLayoutComponent implements OnInit {
  userName: string = "Administrador";

  constructor(private readonly authentication: Authentication) {}

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
