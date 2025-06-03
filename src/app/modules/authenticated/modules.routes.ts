
import { Route } from '@angular/router';
import { PainelInicialComponent } from './painel-inicial/painel-inicial.component';
import { AutenticacaoLoginGuard } from '@app/core/service/guard';

export const ROUTES: Route[] = [
  {
      path: '',
      component: PainelInicialComponent,
      title: 'Painel Inicial',
      canActivate:[AutenticacaoLoginGuard]
    },
];
