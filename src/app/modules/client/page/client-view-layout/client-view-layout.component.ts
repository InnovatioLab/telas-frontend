import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ClientMenuSideComponent } from '@app/shared/components/client-menu-side/client-menu-side.component';
import { HeaderComponent } from '@app/shared/components/header/header.component';
import { ContentWrapperComponent } from '@app/shared/components/content-wrapper/content-wrapper.component';

@Component({
  selector: 'app-client-view-layout',
  templateUrl: './client-view-layout.component.html',
  standalone: true,
  imports: [HeaderComponent, RouterModule, ClientMenuSideComponent, ContentWrapperComponent]
})
export class ClientLayoutComponent {}
