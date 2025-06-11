import { Route } from '@angular/router';
import { AdminViewLayoutComponent } from './pages/admin-view-layout/admin-view-layout.component';
import { AdminViewComponent } from './components/admin-view/admin-view.component';
import { AdminAuthenticatedGuard } from '@app/core/service/guard/admin-authenticated.guard';
import { ManagementMonitorsComponent } from './components/management-monitors/management-monitors.component';

export const ROUTES: Route[] = [
  {
    path: '',
    component: AdminViewLayoutComponent,
    canActivate: [AdminAuthenticatedGuard],
    children: [
      {
        path: '',
        component: AdminViewComponent
      },
      {
        path: 'monitors',
        component: ManagementMonitorsComponent
      }
    ]
  }
];
