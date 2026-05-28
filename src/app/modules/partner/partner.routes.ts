import { Route } from "@angular/router";
import {
  ClientAuthenticatedGuard,
  partnerScreensGuard,
} from "@app/core/service/guard";
import { AlterarSenhaComponent } from "@app/shared/components/alterar-senha/alterar-senha.component";
import { ViewEditProfileComponent } from "@app/shared/components/view-edit-profile/view-edit-profile.component";
import { ClientViewComponent } from "../client/components/client-view/client-view.component";
import { PartnerMapUploadComponent } from "../client/components/partner-map-upload/partner-map-upload.component";
import { PartnerPendingAdsComponent } from "../client/components/partner-pending-ads/partner-pending-ads.component";
import { PartnerScreensComponent } from "../client/components/partner-screens/partner-screens.component";
import { ClientViewLayoutComponent } from "../client/page/client-view-layout/client-view-layout.component";

export const PARTNER_ROUTES: Route[] = [
  {
    path: "",
    component: ClientViewLayoutComponent,
    canActivate: [ClientAuthenticatedGuard, partnerScreensGuard],
    children: [
      {
        path: "",
        redirectTo: "screens",
        pathMatch: "full",
      },
      {
        path: "screens",
        component: PartnerScreensComponent,
        title: "My screens",
      },
      {
        path: "map-upload/:monitorId",
        component: PartnerMapUploadComponent,
        title: "Submit ad to screen",
      },
      {
        path: "ads-review",
        component: PartnerPendingAdsComponent,
        title: "Review ads",
      },
      {
        path: "map",
        component: ClientViewComponent,
        title: "Map",
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
