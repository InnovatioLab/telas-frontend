import { Route } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { LogoutComponent } from './logout/logout.component';
import { RecuperarSenhaComponent } from './recuperar-senha/recuperar-senha.component';

export const ROUTES: Route[] = [
  {
    path: 'login',
    component: LoginComponent,
    title: 'Login',
  },
  {
    path: 'logout',
    component: LogoutComponent,
    title: 'Logout',
  },
  {
    path: 'recover-password',
    component: RecuperarSenhaComponent,
    title: 'Recover Password',
  }
];
