import { Routes } from '@angular/router';

export const appRoutes: Routes = [
  {
    path: '',
    loadChildren: () => import('./modules/manage-access/modules.routes').then((mod) => mod.ROUTES),
  },
  {
    path: 'app',
    loadChildren: () => import('./modules/client-authenticated/modules.routes').then((mod) => mod.ROUTES),
  },
  {
    path: 'register',
    loadChildren: () => import('./modules/register/modules.routes').then((mod) => mod.ROUTES),
  },
  {
    path: 'client',
    loadChildren: () => import('./modules/client-authenticated/modules.routes').then((mod) => mod.ROUTES),
  },
    {
    path: 'admin',
    loadChildren: () => import('./modules/admin/modules.routes').then(m => m.ROUTES),
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
