import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '@app/shared/components/header/header.component';
import { RodapeComponent } from '@app/shared/components/rodape/rodape.component';
import { ClientMenuSideComponent } from '@app/shared/components/client-menu-side/client-menu-side.component';

@Component({
  selector: 'feat-wish-list',
  standalone: true,
  imports: [CommonModule, HeaderComponent, RodapeComponent, ClientMenuSideComponent],
  templateUrl: './wish-list.component.html',
  styleUrls: ['./wish-list.component.scss']
})
export class WishListComponent { }
