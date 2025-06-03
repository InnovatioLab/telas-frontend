import { Route } from '@angular/router';
import { RetomarCadastroComponent } from './retomar-cadastro/retomar-cadastro.component';
import { CadastroComponent } from './cadastro/cadastro.component';

export const ROUTES: Route[] = [
  {
    path: '',
    component: CadastroComponent
  },
  {
    path: 'resume',
    component: RetomarCadastroComponent
  }
];
