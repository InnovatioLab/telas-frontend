import { Route } from "@angular/router";
import {
  ClientAuthenticatedGuard,
  MyTelasGuard
} from "@app/core/service/guard";
import { SubscriptionsGuard } from "@app/core/service/guard/subscriptions.guard";
import { AlterarSenhaComponent } from "../../shared/components/alterar-senha/alterar-senha.component";
import { ClientViewComponent } from "./components/client-view/client-view.component";
import { ManagementSubscriptionsComponent } from "./components/management-subscriptions/management-subscriptions.component";
import { MyTelasComponent } from "./components/my-telas/my-telas.component";
import { ViewEditProfileComponent } from "./components/view-edit-profile/view-edit-profile.component";
import { WishListComponent } from "./components/wish-list/wish-list.component";
import { ClientViewLayoutComponent } from "./page/client-view-layout/client-view-layout.component";
import { SettingsLayoutComponent } from "./page/settings/settings-layout.component";

export const ROUTES: Route[] = [
  {
    path: "",
    component: ClientViewLayoutComponent,
    canActivate: [ClientAuthenticatedGuard],
    children: [
      {
        path: "",
        component: ClientViewComponent,
        title: "Home",
      },
      {
        path: "wish-list",
        component: WishListComponent,
        title: "Wish List",
      },
      {
        path: "my-telas",
        component: MyTelasComponent,
        canActivate: [MyTelasGuard],
        title: "My Telas",
      },
      {
        path: "subscriptions",
        component: ManagementSubscriptionsComponent,
        canActivate: [SubscriptionsGuard],
        title: "Subscriptions",
      },
    ],
  },
  {
    path: "settings",
    component: SettingsLayoutComponent,
    canActivate: [ClientAuthenticatedGuard],
    children: [
      {
        path: "",
        redirectTo: "profile",
        pathMatch: "full",
      },
      {
        path: "profile",
        component: ViewEditProfileComponent,
        title: "Personal Data",
      },
      {
        path: "change-password",
        component: AlterarSenhaComponent,
        title: "Change Password",
      },
      {
        path: "progress-ad",
        component: ViewEditProfileComponent,
        title: "Ad Progress",
      },
    ],
  },
];
