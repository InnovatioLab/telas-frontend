import { Route } from "@angular/router";
import { AdminAuthenticatedGuard } from "@app/core/service/guard/admin-authenticated.guard";
import { AlterarSenhaComponent } from "../../shared/components/alterar-senha/alterar-senha.component";
import { ViewEditProfileComponent } from "../../shared/components/view-edit-profile/view-edit-profile.component";
import { PrivacyPolicyComponent } from "../application/privacy-policy/privacy-policy.component";
import { TermsOfServiceComponent } from "../application/terms-of-service/terms-of-service.component";
import { AdminViewComponent } from "./components/admin-view/admin-view.component";
import { ManagementAdvertisementsComponent } from "./components/management-advertisements/management-advertisements.component";
import { ManagementBoxesComponent } from "./components/management-boxes/management-boxes.component";
import { ManagementClientsComponent } from "./components/management-clients/management-clients.component";
import { ManagementMonitorsComponent } from "./components/management-monitors/management-monitors.component";
import { AdminViewLayoutComponent } from "./pages/admin-view-layout/admin-view-layout.component";

export const ROUTES: Route[] = [
  {
    path: "",
    component: AdminViewLayoutComponent,
    canActivate: [AdminAuthenticatedGuard],
    children: [
      {
        path: "",
        component: AdminViewComponent,
        title: "Telas - Admin Panel",
      },
      {
        path: "screens",
        component: ManagementMonitorsComponent,
        title: "Screens Management",
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
        path: "boxes",
        component: ManagementBoxesComponent,
        title: "Boxes Management",
      },
      {
        path: "ads",
        component: ManagementAdvertisementsComponent,
        title: "Ads Management",
      },
      {
        path: "clients",
        component: ManagementClientsComponent,
        title: "Clients Management",
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
    ],
  },
];
