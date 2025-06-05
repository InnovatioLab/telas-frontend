import { Route } from '@angular/router';
import { AutenticacaoLoginGuard } from '@app/core/service/guard';
import { ClientViewComponent } from './client-view/client-view.component';
import { WishListComponent } from './wish-list/wish-list.component';
import { LayoutComponent } from './page/layout.component';

export const ROUTES: Route[] = [
  {
    path: '',
    component: LayoutComponent,
    canActivate: [AutenticacaoLoginGuard],
    children: [
      {
        path: '',
        component: ClientViewComponent,
        title: 'Home'
      },
      {
        path: 'wish-list',
        component: WishListComponent,
        title: 'Wish List'
      }
    ]
  }
];
