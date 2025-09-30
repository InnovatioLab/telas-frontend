import { Route } from "@angular/router";
import {
  ClientAuthenticatedGuard,
  MyTelasGuard,
} from "@app/core/service/guard";
import { SubscriptionsGuard } from "@app/core/service/guard/subscriptions.guard";
import { AlterarSenhaComponent } from "../../shared/components/alterar-senha/alterar-senha.component";
import { ViewEditProfileComponent } from "../../shared/components/view-edit-profile/view-edit-profile.component";
import { PrivacyPolicyComponent } from "../application/privacy-policy/privacy-policy.component";
import { TermsOfServiceComponent } from "../application/terms-of-service/terms-of-service.component";
import { ClientViewComponent } from "./components/client-view/client-view.component";
import { ManagementSubscriptionsComponent } from "./components/management-subscriptions/management-subscriptions.component";
import { MyTelasComponent } from "./components/my-telas/my-telas.component";
import { WishListComponent } from "./components/wish-list/wish-list.component";
import { ClientViewLayoutComponent } from "./page/client-view-layout/client-view-layout.component";

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
        path: "wishlist",
        component: WishListComponent,
        title: "Wishlist",
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
      {
        path: "privacy-policy",
        component: PrivacyPolicyComponent,
        title: "Privacy Policy",
      },
      {
        path: "terms-of-service",
        component: TermsOfServiceComponent,
        title: "Terms of Service",
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
    ],
  },
];
