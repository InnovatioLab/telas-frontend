import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ContentWrapperComponent } from '@app/shared/components/content-wrapper/content-wrapper.component';
import { HeaderComponent } from '@app/shared/components/header/header.component';
import { MenuComponent } from '@app/shared/components/menu/menu.component';
import { RodapeComponent } from "@app/shared/components/rodape/rodape.component";

@Component({
  selector: 'app-client-view-layout',
  templateUrl: './client-view-layout.component.html',
  standalone: true,
  imports: [HeaderComponent, RouterModule, MenuComponent, ContentWrapperComponent, RodapeComponent]
})
export class ClientViewLayoutComponent {}
