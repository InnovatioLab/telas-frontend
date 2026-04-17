import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import {
  AdminPermissionRow,
  DeveloperPermissionService,
  EmailAlertCategoryOption,
} from "@app/core/service/api/developer-permission.service";
import { ToastService } from "@app/core/service/state/toast.service";
import { IconsModule } from "@app/shared/icons/icons.module";
import { PrimengModule } from "@app/shared/primeng/primeng.module";
import { CheckboxModule } from "primeng/checkbox";
import { FormsModule } from "@angular/forms";
import { forkJoin } from "rxjs";
import { finalize, map } from "rxjs/operators";

const PERMISSION_LABELS: Record<string, string> = {
  ADMIN_CLIENTS_DEACTIVATE: "Deactivate clients",
  MONITORING_LOGS_VIEW: "Application logs",
  MONITORING_SCHEDULER_VIEW: "Scheduled jobs",
  MONITORING_SMART_PLUG_ADMIN: "Smart plugs (monitor)",
  MONITORING_TESTING_EXECUTE: "Run monitoring tests",
  MONITORING_TESTING_VIEW: "View monitoring tests",
};

@Component({
  selector: "app-developer-permissions",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PrimengModule,
    IconsModule,
    CheckboxModule,
  ],
  templateUrl: "./developer-permissions.component.html",
  styleUrls: ["./developer-permissions.component.scss"],
})
export class DeveloperPermissionsComponent implements OnInit {
  rows: AdminPermissionRow[] = [];
  catalog: string[] = [];
  emailAlertCategories: EmailAlertCategoryOption[] = [];
  emailPrefsByClient: Record<string, Record<string, boolean>> = {};
  loading = false;
  savingClientId: string | null = null;
  savingEmailClientId: string | null = null;

  constructor(
    private readonly developerPermissionService: DeveloperPermissionService,
    private readonly toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.reload();
  }

  labelForPermission(code: string): string {
    const mapped = PERMISSION_LABELS[code];
    if (mapped) {
      return mapped;
    }
    return code
      .split("_")
      .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
      .join(" ");
  }

  reload(): void {
    this.loading = true;
    forkJoin({
      catalog: this.developerPermissionService.permissionCatalog(),
      emailCatalog: this.developerPermissionService.emailAlertCatalog(),
      admins: this.developerPermissionService.listAdmins(),
    }).subscribe({
      next: ({ catalog, emailCatalog, admins }) => {
        this.catalog = catalog;
        this.emailAlertCategories = emailCatalog;
        this.rows = admins;
        if (admins.length === 0) {
          this.emailPrefsByClient = {};
          this.loading = false;
          return;
        }
        forkJoin(
          admins.map((a) =>
            this.developerPermissionService.getEmailAlertPreferences(a.clientId).pipe(
              map((r) => ({ id: a.clientId, prefs: r.preferences ?? {} }))
            )
          )
        ).subscribe({
          next: (pairs) => {
            this.emailPrefsByClient = {};
            for (const p of pairs) {
              this.emailPrefsByClient[p.id] = p.prefs;
            }
            this.loading = false;
          },
          error: () => {
            this.emailPrefsByClient = {};
            this.loading = false;
            this.toastService.erro("Could not load email alert preferences.");
          },
        });
      },
      error: () => {
        this.catalog = [];
        this.emailAlertCategories = [];
        this.rows = [];
        this.loading = false;
        this.toastService.erro("Could not load developer permission data.");
      },
    });
  }

  isGranted(row: AdminPermissionRow, code: string): boolean {
    return row.grantedPermissions?.includes(code) ?? false;
  }

  toggle(row: AdminPermissionRow, code: string, checked: boolean): void {
    const next = new Set(row.grantedPermissions ?? []);
    if (checked) {
      next.add(code);
    } else {
      next.delete(code);
    }
    row.grantedPermissions = Array.from(next);
    this.persist(row);
  }

  isEmailAlertEnabled(row: AdminPermissionRow, code: string): boolean {
    return this.emailPrefsByClient[row.clientId]?.[code] ?? false;
  }

  toggleEmailAlert(row: AdminPermissionRow, code: string, checked: boolean): void {
    const next = { ...(this.emailPrefsByClient[row.clientId] ?? {}) };
    next[code] = checked;
    this.emailPrefsByClient[row.clientId] = next;
    this.savingEmailClientId = row.clientId;
    this.developerPermissionService
      .replaceEmailAlertPreferences(row.clientId, next)
      .pipe(
        finalize(() => {
          this.savingEmailClientId = null;
        })
      )
      .subscribe({
        next: () => {
          this.toastService.sucesso("Email alert preferences updated.");
        },
        error: (err) => {
          const status = err?.status;
          if (status === 403) {
            this.toastService.erro("You do not have permission to change email alerts.");
          } else {
            this.toastService.erro("Failed to save email alert preferences.");
          }
          this.reload();
        },
      });
  }

  private persist(row: AdminPermissionRow): void {
    this.savingClientId = row.clientId;
    this.developerPermissionService
      .replacePermissions(row.clientId, row.grantedPermissions ?? [])
      .pipe(
        finalize(() => {
          this.savingClientId = null;
        })
      )
      .subscribe({
        next: () => {
          this.toastService.sucesso("Permissions updated.");
        },
        error: (err) => {
          const status = err?.status;
          if (status === 403) {
            this.toastService.erro("You do not have permission to change grants.");
          } else {
            this.toastService.erro("Failed to save permissions.");
          }
          this.reload();
        },
      });
  }
}
