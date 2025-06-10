import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '@app/shared/components/header/header.component';
import { AdminMenuSideComponent } from '@app/shared/components/admin-menu-side/admin-menu-side.component';

@Component({
  selector: 'app-admin-view-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    HeaderComponent,
    AdminMenuSideComponent
  ],
  templateUrl: './admin-view-layout.component.html',
  styleUrls: ['./admin-view-layout.component.scss']
})
export class AdminLayoutComponent {
  // Implementação do layout para a visualização de administrador
}
