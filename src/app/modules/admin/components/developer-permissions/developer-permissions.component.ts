import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import {
  AdminPermissionRow,
  DeveloperPermissionService,
} from "@app/core/service/api/developer-permission.service";
import { ToastService } from "@app/core/service/state/toast.service";
import { IconsModule } from "@app/shared/icons/icons.module";
import { PrimengModule } from "@app/shared/primeng/primeng.module";
import { CheckboxModule } from "primeng/checkbox";
import { FormsModule } from "@angular/forms";
import { finalize } from "rxjs";

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
  loading = false;
  savingClientId: string | null = null;

  constructor(
    private readonly developerPermissionService: DeveloperPermissionService,
    private readonly toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.loading = true;
    this.developerPermissionService
      .permissionCatalog()
      .subscribe({
        next: (codes) => {
          this.catalog = codes;
          this.developerPermissionService.listAdmins().subscribe({
            next: (list) => {
              this.rows = list;
              this.loading = false;
            },
            error: () => {
              this.rows = [];
              this.loading = false;
              this.toastService.erro("Não foi possível carregar os administradores.");
            },
          });
        },
        error: () => {
          this.catalog = [];
          this.loading = false;
          this.toastService.erro("Não foi possível carregar o catálogo de permissões.");
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
          this.toastService.sucesso("Permissões atualizadas.");
        },
        error: (err) => {
          const status = err?.status;
          if (status === 403) {
            this.toastService.erro("Sem permissão para alterar grants.");
          } else {
            this.toastService.erro("Falha ao guardar permissões.");
          }
          this.reload();
        },
      });
  }
}
