import { Route } from "@angular/router";
import { GuestLadingComponent } from "./guest-lading/guest-lading.component";
import { ViewLayoutComponent } from "./page/view-layout.component";
import { PrivacyPolicyComponent } from "./privacy-policy/privacy-policy.component";
import { TermsOfServiceComponent } from "./terms-of-service/terms-of-service.component";

export const ROUTES: Route[] = [
  {
    path: "",
    component: ViewLayoutComponent,
    children: [
      {
        path: "",
        component: GuestLadingComponent,
        title: "Telas",
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
