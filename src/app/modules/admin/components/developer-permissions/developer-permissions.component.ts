import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { TableModule } from "primeng/table";
import { CheckboxModule } from "primeng/checkbox";
import { CardModule } from "primeng/card";
import { TooltipModule } from "primeng/tooltip";
import { forkJoin, of } from "rxjs";
import { finalize, map, switchMap, tap } from "rxjs/operators";
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

type AdminRowView = AdminPermissionRow & { emailAlertPreferences: Record<string, boolean> };

@Component({
  selector: "app-developer-permissions",
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, CheckboxModule, CardModule, TooltipModule],
  templateUrl: "./developer-permissions.component.html",
  styleUrl: "./developer-permissions.component.scss",
})
export class DeveloperPermissionsComponent implements OnInit {
  loading = false;
  errorMessage: string | null = null;

  rows: AdminRowView[] = [];
  partnerRows: AdminPermissionRow[] = [];
  catalog: string[] = [];
  partnerCatalog: string[] = [];
  emailAlertCategories: EmailAlertCategoryOption[] = [];

  savingClientId: string | null = null;
  savingPartnerClientId: string | null = null;
  savingEmailClientId: string | null = null;

  constructor(private readonly developerPermissionService: DeveloperPermissionService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.errorMessage = null;
    forkJoin({
      admins: this.developerPermissionService.listAdmins(),
      partners: this.developerPermissionService.listPartners(),
      catalog: this.developerPermissionService.permissionCatalog("ADMIN"),
      partnerCatalog: this.developerPermissionService.permissionCatalog("PARTNER"),
      emailAlertCategories: this.developerPermissionService.emailAlertCatalog(),
    })
      .pipe(
        switchMap(({ admins, partners, catalog, partnerCatalog, emailAlertCategories }) => {
          const sortedCatalog = [...catalog].sort((a, b) =>
            this.labelForPermission(a).localeCompare(this.labelForPermission(b), undefined, {
              sensitivity: "base",
            }),
          );
          const sortedPartnerCatalog = [...partnerCatalog].sort((a, b) =>
            this.labelForPermission(a).localeCompare(this.labelForPermission(b), undefined, {
              sensitivity: "base",
            }),
          );
          const sortedCats = [...emailAlertCategories].sort((x, y) =>
            x.labelEn.localeCompare(y.labelEn, undefined, { sensitivity: "base" }),
          );
          this.catalog = sortedCatalog;
          this.partnerCatalog = sortedPartnerCatalog;
          this.partnerRows = partners;
          this.emailAlertCategories = sortedCats;

          if (admins.length === 0) {
            this.rows = [];
            return of(void 0);
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
                }),
              ),
            ),
          ).pipe(
            tap((withPrefs) => {
              this.rows = withPrefs;
            }),
            map((): undefined => undefined),
          );
        }),
        finalize(() => {
          this.loading = false;
        }),
      )
      .subscribe({
        error: () => {
          this.errorMessage = "Could not load permissions.";
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

  togglePartner(row: AdminPermissionRow, code: string, checked: boolean): void {
    const next = new Set(row.grantedPermissions);
    if (checked) {
      next.add(code);
    } else {
      next.delete(code);
    }
    const list = Array.from(next);
    this.savingPartnerClientId = row.clientId;
    this.developerPermissionService.replacePermissions(row.clientId, list).subscribe({
      next: () => {
        row.grantedPermissions = list;
        this.savingPartnerClientId = null;
      },
      error: () => {
        this.savingPartnerClientId = null;
        this.errorMessage = "Could not update partner permissions.";
      },
    });
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
