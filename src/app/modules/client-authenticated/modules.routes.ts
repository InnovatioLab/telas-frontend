import { Route } from '@angular/router';
import { AutenticacaoLoginGuard } from '@app/core/service/guard';
import { ClientViewComponent } from './client-view/client-view.component';
import { WishListComponent } from './wish-list/wish-list.component';

export const ROUTES: Route[] = [
  {
    path: '',
    component: ClientViewComponent,
    title: 'Home',
    canActivate: [AutenticacaoLoginGuard]
  },
  {
    path: 'wish-list',
    component: WishListComponent,
    title: 'Wish List',
    canActivate: [AutenticacaoLoginGuard]
  }
];
