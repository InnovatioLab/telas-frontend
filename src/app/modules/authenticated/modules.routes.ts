import { Route } from '@angular/router';
import { AutenticacaoLoginGuard } from '@app/core/service/guard';
import { ClientViewComponent } from './client-view/client-view.component';

export const ROUTES: Route[] = [
  {
    path: '',
    component: ClientViewComponent,
    title: 'Home',
    canActivate: [AutenticacaoLoginGuard]
  },
];
