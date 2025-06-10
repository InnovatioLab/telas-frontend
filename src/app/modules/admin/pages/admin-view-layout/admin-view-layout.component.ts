import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '@app/shared/components/header/header.component';
import { RodapeComponent } from '@app/shared/components/rodape/rodape.component';

@Component({
  selector: 'app-admin-layout',
  templateUrl: './admin-view-layout.component.html',
  styleUrls: ['./admin-view-layout.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, RodapeComponent]
})
export class AdminLayoutComponent {
  // Componente simples que apenas fornece o layout
}
