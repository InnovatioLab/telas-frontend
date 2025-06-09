import { Route } from '@angular/router';
import { AutenticacaoLoginGuard } from '@app/core/service/guard';
import { ClientViewComponent } from './components/client-view/client-view.component';
import { WishListComponent } from './components/wish-list/wish-list.component';
import { ClientLayoutComponent } from './page/client-view-layout/client-view-layout.component';
import { SettingsLayoutComponent } from './page/settings/settings-layout.component';
import { ViewEditProfileComponent } from './components/view-edit-profile/view-edit-profile.component';
import { AlterarSenhaComponent } from './components/alterar-senha/alterar-senha.component';

export const ROUTES: Route[] = [
  {
    path: '',
    component: ClientLayoutComponent,
    canActivate: [AutenticacaoLoginGuard],
    children: [
      {
        path: '',
        component: ClientViewComponent,
        title: 'Home'
      },
      {
        path: 'wish-list',
        component: WishListComponent,
        title: 'Wish List'
      }
    ]
  },
  {
    path: 'settings',
    component: SettingsLayoutComponent,
    canActivate: [AutenticacaoLoginGuard],
    children: [
      {
        path: '',
        redirectTo: 'profile',
        pathMatch: 'full'
      },
      {
        path: 'profile',
        component: ViewEditProfileComponent,
        title: 'Personal Data'
      },
      {
        path: 'change-password',
        component: AlterarSenhaComponent,
        title: 'Change Password'
      },
      {
        path: 'progress-ad',
        component: ViewEditProfileComponent,
        title: 'Ad Progress'
      },
      {
        path: 'subscriptions',
        component: ViewEditProfileComponent,
        title: 'Subscriptions'
      }
    ]
  }
];
