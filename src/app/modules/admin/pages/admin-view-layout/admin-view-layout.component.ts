import { Component } from '@angular/core';
import { HeaderComponent } from '@app/shared/components/header/header.component';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-admin-view-layout',
  templateUrl: './admin-view-layout.component.html',
  standalone: true,
  imports: [HeaderComponent, RouterModule]
})
export class AdminLayoutComponent {}
