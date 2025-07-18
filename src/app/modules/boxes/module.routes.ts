import { Routes } from '@angular/router';
import { BoxLoginComponent } from './box-login/box-login.component';
import { BoxStatusComponent } from './box-status/box-status.component';

export const routes: Routes = [
  {
    path: 'login',
    component: BoxLoginComponent
  },
  {
    path: 'status',
    component: BoxStatusComponent
  },
];
