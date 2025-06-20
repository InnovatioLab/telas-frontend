import { Route } from '@angular/router';
import { RetomarCadastroComponent } from './retomar-cadastro/retomar-cadastro.component';
import { CadastroComponent } from './cadastro/cadastro.component';
import { ValidacaoCadastroComponent } from './validacao-cadastro/validacao-cadastro.component';
import { RecuperarSenhaComponent } from '../manage-access/recuperar-senha/recuperar-senha.component';
import { ValidacaoRecuperaSenhaComponent } from '../manage-access/validacao-recuperar-senha/validacao-recuperar-senha.component';

export const ROUTES: Route[] = [
  {
    path: '',
    component: CadastroComponent
  },
  {
    path: 'resume',
    component: RetomarCadastroComponent
  },
  {
    path: 'validate/:login',
    component: ValidacaoCadastroComponent,
    title: 'Register Validate'
  },
  {
    path: 'recover-password',
    component: RecuperarSenhaComponent
  },
  {
    path: 'validate-code-recover-password/:login',
    component: ValidacaoRecuperaSenhaComponent,
  }
];
