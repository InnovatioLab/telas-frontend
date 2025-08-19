import { Route } from '@angular/router';
import { AdminAuthenticatedGuard } from '@app/core/service/guard/admin-authenticated.guard';
import { AdminManagementProfileComponent } from './components/admin-managemnt-profile/admin-managemnt-profile.component';
import { AdminViewComponent } from './components/admin-view/admin-view.component';
import { ManagementAdvertisementsComponent } from './components/management-advertisements/management-advertisements.component';
import { ManagementBoxesComponent } from './components/management-boxes/management-boxes.component';
import { ManagementClientsComponent } from './components/management-clients/management-clients.component';
import { ManagementMonitorsComponent } from './components/management-monitors/management-monitors.component';
import { AdminViewLayoutComponent } from './pages/admin-view-layout/admin-view-layout.component';

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
        path: 'screens',
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
        path: 'ads',
        component: ManagementAdvertisementsComponent
      },
      {
        path: 'clients',
        component: ManagementClientsComponent
      }
    ]
  }
];
