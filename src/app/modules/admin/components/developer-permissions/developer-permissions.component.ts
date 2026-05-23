import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { TableModule } from "primeng/table";
import { CheckboxModule } from "primeng/checkbox";
import { CardModule } from "primeng/card";
import { TooltipModule } from "primeng/tooltip";
import { forkJoin, Observable, of } from "rxjs";
import { map, switchMap } from "rxjs/operators";
import {
  AdminPermissionRow,
  DeveloperPermissionService,
  EmailAlertCategoryOption,
} from "../../../../core/service/api/developer-permission.service";
import {
  defaultEmailAlertDescription,
  defaultPermissionDescription,
  EMAIL_ALERT_DESCRIPTIONS,
  PERMISSION_DESCRIPTIONS,
  PERMISSION_LABELS,
} from "./developer-permission-meta";
import {
  LazyTableController,
  LazyTableFilterState,
  LazyTableLoadResult,
} from "@app/shared/utils/lazy-table.controller";

type AdminRowView = AdminPermissionRow & { emailAlertPreferences: Record<string, boolean> };

@Component({
  selector: "app-developer-permissions",
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, CheckboxModule, CardModule, TooltipModule],
  templateUrl: "./developer-permissions.component.html",
  styleUrl: "./developer-permissions.component.scss",
})
export class DeveloperPermissionsComponent implements OnInit {
  errorMessage: string | null = null;

  catalog: string[] = [];
  emailAlertCategories: EmailAlertCategoryOption[] = [];

  partnerSlotsAnyLocationEnabled = false;
  adminCanCreatePartnerEnabled = false;
  savingPartnerPlatformSettings = false;

  savingClientId: string | null = null;
  savingEmailClientId: string | null = null;

  readonly tableController: LazyTableController<AdminRowView, LazyTableFilterState>;

  constructor(private readonly developerPermissionService: DeveloperPermissionService) {
    this.tableController = new LazyTableController(
      { page: 1, size: 10 },
      (filters) => this.fetchAdminRows(filters),
      () => {
        this.errorMessage = "Could not load permissions.";
      }
    );
  }

  get loading(): boolean {
    return this.tableController.loading;
  }

  get rows(): AdminRowView[] {
    return this.tableController.items;
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.errorMessage = null;
    this.tableController.load();
  }

  private fetchAdminRows(
    _filters: LazyTableFilterState
  ): Observable<LazyTableLoadResult<AdminRowView>> {
    return forkJoin({
      admins: this.developerPermissionService.listAdmins(),
      catalog: this.developerPermissionService.permissionCatalog(),
      emailAlertCategories: this.developerPermissionService.emailAlertCatalog(),
      partnerPlatformSettings: this.developerPermissionService.getPartnerPlatformSettings(),
    }).pipe(
      switchMap(({ admins, catalog, emailAlertCategories, partnerPlatformSettings }) => {
        const sortedCatalog = [...catalog].sort((a, b) =>
          this.labelForPermission(a).localeCompare(this.labelForPermission(b), undefined, {
            sensitivity: "base",
          })
        );
        const sortedCats = [...emailAlertCategories].sort((x, y) =>
          x.labelEn.localeCompare(y.labelEn, undefined, { sensitivity: "base" })
        );
        this.catalog = sortedCatalog;
        this.emailAlertCategories = sortedCats;
        this.partnerSlotsAnyLocationEnabled =
          partnerPlatformSettings.partnerSlotsAnyLocationEnabled;
        this.adminCanCreatePartnerEnabled =
          partnerPlatformSettings.adminCanCreatePartnerEnabled;

        if (admins.length === 0) {
          return of({ list: [], totalElements: 0 });
        }

        return forkJoin(
          admins.map((a) =>
            this.developerPermissionService.getEmailAlertPreferences(a.clientId).pipe(
              map((p) => {
                const emailAlertPreferences: Record<string, boolean> = { ...p.preferences };
                for (const opt of sortedCats) {
                  if (emailAlertPreferences[opt.code] === undefined) {
                    emailAlertPreferences[opt.code] = false;
                  }
                }
                return { ...a, emailAlertPreferences } satisfies AdminRowView;
              })
            )
          )
        ).pipe(
          map((withPrefs) => ({
            list: withPrefs,
            totalElements: withPrefs.length,
          }))
        );
      })
    );
  }

  togglePartnerSlotsAnyLocation(checked: boolean): void {
    this.persistPartnerPlatformSettings({
      partnerSlotsAnyLocationEnabled: checked,
      adminCanCreatePartnerEnabled: this.adminCanCreatePartnerEnabled,
    });
  }

  toggleAdminCanCreatePartner(checked: boolean): void {
    this.persistPartnerPlatformSettings({
      partnerSlotsAnyLocationEnabled: this.partnerSlotsAnyLocationEnabled,
      adminCanCreatePartnerEnabled: checked,
    });
  }

  private persistPartnerPlatformSettings(settings: {
    partnerSlotsAnyLocationEnabled: boolean;
    adminCanCreatePartnerEnabled: boolean;
  }): void {
    this.savingPartnerPlatformSettings = true;
    this.developerPermissionService.updatePartnerPlatformSettings(settings).subscribe({
      next: (saved) => {
        this.partnerSlotsAnyLocationEnabled = saved.partnerSlotsAnyLocationEnabled;
        this.adminCanCreatePartnerEnabled = saved.adminCanCreatePartnerEnabled;
        this.savingPartnerPlatformSettings = false;
      },
      error: () => {
        this.savingPartnerPlatformSettings = false;
        this.errorMessage = "Could not update partner platform settings.";
      },
    });
  }

  labelForPermission(code: string): string {
    return PERMISSION_LABELS[code] ?? code.replaceAll("_", " ");
  }

  permissionTooltip(code: string): string {
    const label = this.labelForPermission(code);
    const body = PERMISSION_DESCRIPTIONS[code] ?? defaultPermissionDescription(code);
    return `${label}\n\n${body}\n\nCode: ${code}`;
  }

  emailAlertTooltip(opt: EmailAlertCategoryOption): string {
    const title = opt.labelEn;
    const body = EMAIL_ALERT_DESCRIPTIONS[opt.code] ?? defaultEmailAlertDescription(opt.code);
    return `${title}\n\n${body}\n\nCode: ${opt.code}`;
  }

  isGranted(row: AdminPermissionRow, code: string): boolean {
    return row.grantedPermissions.includes(code);
  }

  toggle(row: AdminRowView, code: string, checked: boolean): void {
    const next = new Set(row.grantedPermissions);
    if (checked) {
      next.add(code);
    } else {
      next.delete(code);
    }
    const list = Array.from(next);
    this.savingClientId = row.clientId;
    this.developerPermissionService.replacePermissions(row.clientId, list).subscribe({
      next: () => {
        row.grantedPermissions = list;
        this.savingClientId = null;
      },
      error: () => {
        this.savingClientId = null;
        this.errorMessage = "Could not update permissions.";
      },
    });
  }

  isEmailAlertEnabled(row: AdminRowView, categoryCode: string): boolean {
    return !!row.emailAlertPreferences[categoryCode];
  }

  toggleEmailAlert(row: AdminRowView, categoryCode: string, checked: boolean): void {
    const next = { ...row.emailAlertPreferences, [categoryCode]: checked };
    this.savingEmailClientId = row.clientId;
    this.developerPermissionService.replaceEmailAlertPreferences(row.clientId, next).subscribe({
      next: () => {
        row.emailAlertPreferences = next;
        this.savingEmailClientId = null;
      },
      error: () => {
        this.savingEmailClientId = null;
        this.errorMessage = "Could not update email alert preferences.";
      },
    });
  }
}
