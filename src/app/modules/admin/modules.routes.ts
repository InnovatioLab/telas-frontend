import { Route } from '@angular/router';
import { AdminLayoutComponent } from './pages/admin-view-layout/admin-view-layout.component';
import { AdminViewComponent } from './components/admin-view/admin-view.component';
import { AdminAuthenticatedGuard } from '@app/core/service/guard/admin-authenticated.guard';

export const ROUTES: Route[] = [
  {
    path: '',
    component: AdminViewComponent,
    canActivate: [AdminAuthenticatedGuard]
  }
];
