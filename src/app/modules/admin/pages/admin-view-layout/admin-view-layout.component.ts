import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Authentication } from '@app/core/service/auth/autenthication';
import { AdminMenuSideComponent } from '@app/shared/components/admin-menu-side/admin-menu-side.component';
import { AlertAdminSidebarComponent } from '@app/shared/components/alert-admin-sidebar/alert-admin-sidebar.component';
import { ContentWrapperComponent } from '@app/shared/components/content-wrapper/content-wrapper.component';
import { HeaderComponent } from '@app/shared/components/header/header.component';

interface ToggleAdminSidebarEvent {
  visible: boolean;
}

@Component({
  selector: 'app-admin-view-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HeaderComponent,
    AdminMenuSideComponent,
    AlertAdminSidebarComponent,
    ContentWrapperComponent
  ],
  templateUrl: './admin-view-layout.component.html',
  styleUrls: ['./admin-view-layout.component.scss']
})
export class AdminViewLayoutComponent implements OnInit {
  userName: string = 'Administrador';

  constructor(private readonly authentication: Authentication) {}

  ngOnInit(): void {
    const client = this.authentication._clientSignal();
    if (client) {
      this.userName = client.businessName;
    }
  }

  onAlertSidebarVisibilityChange(isVisible: boolean): void {
    const header = document.querySelector('app-header') as any;
    header?.updateAdminSidebarVisibility?.(isVisible);
  }
}
