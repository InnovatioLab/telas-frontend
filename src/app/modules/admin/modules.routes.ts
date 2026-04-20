import { Route } from "@angular/router";
import { AdminAuthenticatedGuard } from "@app/core/service/guard/admin-authenticated.guard";
import { DeveloperGuard } from "@app/core/service/guard/developer.guard";
import { MonitoringPermissionGuard } from "@app/core/service/guard/monitoring-permission.guard";
import { AlterarSenhaComponent } from "../../shared/components/alterar-senha/alterar-senha.component";
import { ViewEditProfileComponent } from "../../shared/components/view-edit-profile/view-edit-profile.component";
import { PrivacyPolicyComponent } from "../application/privacy-policy/privacy-policy.component";
import { TermsOfServiceComponent } from "../application/terms-of-service/terms-of-service.component";
import { AdminViewComponent } from "./components/admin-view/admin-view.component";
import { ManagementAdvertisementsComponent } from "./components/management-advertisements/management-advertisements.component";
import { ManagementBoxesComponent } from "./components/management-boxes/management-boxes.component";
import { ManagementClientsComponent } from "./components/management-clients/management-clients.component";
import { ManagementMonitorsComponent } from "./components/management-monitors/management-monitors.component";
import { MonitorAdsManagementComponent } from "./components/monitor-ads-management/monitor-ads-management.component";
import { AdminViewLayoutComponent } from "./pages/admin-view-layout/admin-view-layout.component";
import { AdRequestManagementComponent } from "./components/ad-request-management/ad-request-management.component";
import { ApplicationLogsComponent } from "./components/application-logs/application-logs.component";
import { MonitoringTestingComponent } from "./components/monitoring-testing/monitoring-testing.component";
import { DeveloperPermissionsComponent } from "./components/developer-permissions/developer-permissions.component";
import { AdminAdOperationsComponent } from "./components/admin-ad-operations/admin-ad-operations.component";
import { MonitoringPermission } from "@app/model/monitoring-permission";
import { ManagementSmartPlugsComponent } from "./components/management-smart-plugs/management-smart-plugs.component";

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
        path: "screens/:monitorId/manage-ads",
        component: MonitorAdsManagementComponent,
        title: "Manage Screen Ads",
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
        component: AdRequestManagementComponent,
        title: "Ads Management",
      },
      {
        path: "clients",
        component: ManagementClientsComponent,
        title: "Clients Management",
      },
      {
        path: "ad-operations",
        component: AdminAdOperationsComponent,
        title: "Ads & subscriptions",
      },
      {
        path: "logs",
        component: ApplicationLogsComponent,
        title: "Application logs",
        canActivate: [MonitoringPermissionGuard],
        data: {
          permissionsAny: [
            MonitoringPermission.MONITORING_LOGS_VIEW,
            MonitoringPermission.MONITORING_SCHEDULER_VIEW,
            MonitoringPermission.MONITORING_CONNECTIVITY_PROBE_SETTINGS,
            MonitoringPermission.MONITORING_BOX_PING_VIEW,
          ],
        },
      },
      {
        path: "testing",
        component: MonitoringTestingComponent,
        title: "Monitoring testing",
        canActivate: [MonitoringPermissionGuard],
        data: { permission: MonitoringPermission.MONITORING_TESTING_VIEW },
      },
      {
        path: "smart-plugs",
        component: ManagementSmartPlugsComponent,
        title: "Smart plugs",
        canActivate: [MonitoringPermissionGuard],
        data: { permission: MonitoringPermission.MONITORING_SMART_PLUG_VIEW },
      },
      {
        path: "access",
        component: DeveloperPermissionsComponent,
        title: "Permissions",
        canActivate: [DeveloperGuard],
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
