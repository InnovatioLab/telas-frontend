import { Routes } from '@angular/router';

export const appRoutes: Routes = [
  {
    path: '',
    loadChildren: () => import('./modules/application/modules.routes').then((mod) => mod.ROUTES),
  },
  {
    path: 'auth',
    loadChildren: () => import('./modules/manage-access/modules.routes').then((mod) => mod.ROUTES),
  },
  {
    path: 'register',
    loadChildren: () => import('./modules/register/modules.routes').then((mod) => mod.ROUTES),
  },
  {
    path: 'client',
    loadChildren: () => import('./modules/client/modules.routes').then((mod) => mod.ROUTES),
  },
  {
    path: 'admin',
    loadChildren: () => import('./modules/admin/modules.routes').then(m => m.ROUTES),
  },
  {
    path: 'box',
    loadChildren: () => import('./modules/boxes/module.routes').then(m => m.routes),
  },
  {
    path: '**',
    redirectTo: 'auth/login'
  }
];
