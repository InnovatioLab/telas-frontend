import { Route } from "@angular/router";
import {
  ClientAuthenticatedGuard,
  MyTelasGuard,
  partnerScreensGuard,
  redirectPartnerFromClientShoppingGuard,
} from "@app/core/service/guard";
import { SubscriptionsGuard } from "@app/core/service/guard/subscriptions.guard";
import { AlterarSenhaComponent } from "../../shared/components/alterar-senha/alterar-senha.component";
import { ViewEditProfileComponent } from "../../shared/components/view-edit-profile/view-edit-profile.component";
import { PrivacyPolicyComponent } from "../application/privacy-policy/privacy-policy.component";
import { TermsOfServiceComponent } from "../application/terms-of-service/terms-of-service.component";
import { ClientViewComponent } from "./components/client-view/client-view.component";
import { ManagementSubscriptionsComponent } from "./components/management-subscriptions/management-subscriptions.component";
import { MyTelasComponent } from "./components/my-telas/my-telas.component";
import { NextStepsComponent } from "./components/next-steps/next-steps.component";
import { WishListComponent } from "./components/wish-list/wish-list.component";
import { ClientViewLayoutComponent } from "./page/client-view-layout/client-view-layout.component";
import { PartnerScreensComponent } from "./components/partner-screens/partner-screens.component";
import { PartnerMapUploadComponent } from "./components/partner-map-upload/partner-map-upload.component";
import { PartnerPendingAdsComponent } from "./components/partner-pending-ads/partner-pending-ads.component";

export const ROUTES: Route[] = [
  {
    path: "",
    component: ClientViewLayoutComponent,
    canActivate: [ClientAuthenticatedGuard],
    children: [
      {
        path: "",
        component: ClientViewComponent,
        canActivate: [redirectPartnerFromClientShoppingGuard],
        title: "Home",
      },
      {
        path: "screens",
        component: PartnerScreensComponent,
        canActivate: [partnerScreensGuard],
        title: "My screens",
      },
      {
        path: "map-upload/:monitorId",
        component: PartnerMapUploadComponent,
        canActivate: [partnerScreensGuard],
        title: "Submit ad to screen",
      },
      {
        path: "partner-ads",
        component: PartnerPendingAdsComponent,
        canActivate: [partnerScreensGuard],
        title: "Review ads",
      },
      {
        path: "map",
        component: ClientViewComponent,
        canActivate: [partnerScreensGuard],
        title: "Map",
      },
      {
        path: "wishlist",
        component: WishListComponent,
        canActivate: [redirectPartnerFromClientShoppingGuard],
        title: "Wishlist",
      },
      {
        path: "my-telas",
        component: MyTelasComponent,
        canActivate: [MyTelasGuard, redirectPartnerFromClientShoppingGuard],
        title: "My Telas",
      },
      {
        path: "next-steps",
        component: NextStepsComponent,
        canActivate: [MyTelasGuard, redirectPartnerFromClientShoppingGuard],
        title: "Next steps",
      },
      {
        path: "subscriptions",
        component: ManagementSubscriptionsComponent,
        canActivate: [SubscriptionsGuard, redirectPartnerFromClientShoppingGuard],
        title: "Subscriptions",
      },
      {
        path: "subscriptions/:uuid",
        component: ManagementSubscriptionsComponent,
        canActivate: [SubscriptionsGuard, redirectPartnerFromClientShoppingGuard],
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
