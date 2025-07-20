import { Route } from '@angular/router';
import { AdminViewLayoutComponent } from './pages/admin-view-layout/admin-view-layout.component';
import { AdminViewComponent } from './components/admin-view/admin-view.component';
import { AdminAuthenticatedGuard } from '@app/core/service/guard/admin-authenticated.guard';
import { ManagementMonitorsComponent } from './components/management-monitors/management-monitors.component';
import { AdminManagementProfileComponent } from './components/admin-managemnt-profile/admin-managemnt-profile.component';
import { ManagementBoxesComponent } from './components/management-boxes/management-boxes.component';
import { ManagementAdvertisementsComponent } from './components/management-advertisements/management-advertisements.component';
import { ManagementClientsComponent } from './components/management-clients/management-clients.component';

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
      },
      {
        path: 'profile',
        component: AdminManagementProfileComponent
      },
      {
        path: 'boxes',
        component: ManagementBoxesComponent
      },
      {
        path: 'advertisements',
        component: ManagementAdvertisementsComponent
      },
      {
        path: 'clients',
        component: ManagementClientsComponent
      }
    ]
  }
];
