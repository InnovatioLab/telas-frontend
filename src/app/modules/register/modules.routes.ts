import { Route } from '@angular/router';
import { RecoverPasswordComponent } from '../manage-access/recover-password/recover-password.component';
import { ValidateRecoverPasswordComponent } from '../manage-access/validate-recover-password/validate-recover-password.component';
import { RegistrationComponent } from './registration/registration.component';
import { ResumeRegistrationComponent } from './resume-registration/resume-registration.component';
import { ValidateRegistrationComponent } from './validate-registration/validate-registration.component';

export const ROUTES: Route[] = [
  {
    path: '',
    component: RegistrationComponent
  },
  {
    path: 'resume',
    component: ResumeRegistrationComponent
  },
  {
    path: 'validate/:login',
    component: ValidateRegistrationComponent,
    title: 'Register Validate'
  },
  {
    path: 'recover-password',
    component: RecoverPasswordComponent
  },
  {
    path: 'validate-code-recover-password/:login',
    component: ValidateRecoverPasswordComponent,
  }
];
