import { CommonModule } from "@angular/common";
import { Component, OnInit, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { BoxService } from "@app/core/service/api/box.service";
import {
  SmartPlugAccountAdminService,
  SmartPlugAccountDto,
} from "@app/core/service/api/smart-plug-account-admin.service";
import { Authentication } from "@app/core/service/auth/autenthication";
import { ToastService } from "@app/core/service/state/toast.service";
import { hasMonitoringPermission } from "@app/core/utils/monitoring-permission.util";
import { Box } from "@app/model/box";
import { MonitoringPermission } from "@app/model/monitoring-permission";
import { IconsModule } from "@app/shared/icons/icons.module";
import { PrimengModule } from "@app/shared/primeng/primeng.module";
import { TagModule } from "primeng/tag";

@Component({
  selector: "app-management-smart-plug-accounts",
  standalone: true,
  imports: [CommonModule, PrimengModule, FormsModule, IconsModule, TagModule],
  templateUrl: "./management-smart-plug-accounts.component.html",
  styleUrls: ["./management-smart-plug-accounts.component.scss"],
})
export class ManagementSmartPlugAccountsComponent implements OnInit {
  private readonly boxService = inject(BoxService);
  private readonly accountApi = inject(SmartPlugAccountAdminService);
  private readonly toast = inject(ToastService);
  private readonly authentication = inject(Authentication);

  loading = false;
  boxes: Box[] = [];
  selectedBoxId: string | null = null;
  accounts: SmartPlugAccountDto[] = [];

  dialogVisible = false;
  dialogCreate = false;
  editingRow: SmartPlugAccountDto | null = null;
  formVendor = "KASA";
  formEmail = "";
  formPassword = "";
  formEnabled = true;

  vendors = [
    { label: "KASA", value: "KASA" },
    { label: "TAPO", value: "TAPO" },
    { label: "TPLINK", value: "TPLINK" },
  ];

  ngOnInit(): void {
    this.boxService.getBoxes({}).subscribe({
      next: (list) => {
        this.boxes = list ?? [];
        if (this.boxes.length === 1) {
          this.selectedBoxId = this.boxes[0].id;
          this.loadAccounts();
        }
      },
      error: () => this.toast.erro("Could not load boxes."),
    });
  }

  get canAdmin(): boolean {
    const c = this.authentication.client();
    return hasMonitoringPermission(c, MonitoringPermission.MONITORING_SMART_PLUG_ADMIN);
  }

  onBoxChange(): void {
    this.accounts = [];
    if (this.selectedBoxId) {
      this.loadAccounts();
    }
  }

  loadAccounts(): void {
    if (!this.selectedBoxId) {
      return;
    }
    this.loading = true;
    this.accountApi.listByBox(this.selectedBoxId).subscribe({
      next: (list) => {
        this.accounts = list ?? [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toast.erro("Could not load smart plug accounts.");
      },
    });
  }

  openCreate(): void {
    this.dialogCreate = true;
    this.editingRow = null;
    this.formVendor = "KASA";
    this.formEmail = "";
    this.formPassword = "";
    this.formEnabled = true;
    this.dialogVisible = true;
  }

  openEdit(row: SmartPlugAccountDto): void {
    this.dialogCreate = false;
    this.editingRow = row;
    this.formVendor = row.vendor;
    this.formEmail = row.accountEmail ?? "";
    this.formPassword = "";
    this.formEnabled = row.enabled;
    this.dialogVisible = true;
  }

  closeDialog(): void {
    this.dialogVisible = false;
    this.editingRow = null;
    this.dialogCreate = false;
  }

  save(): void {
    if (!this.canAdmin) {
      return;
    }
    if (this.dialogCreate) {
      if (!this.selectedBoxId) {
        this.toast.erro("Select a box.");
        return;
      }
      this.accountApi
        .create({
          boxId: this.selectedBoxId,
          vendor: this.formVendor,
          accountEmail: this.formEmail.trim() || null,
          password: this.formPassword || null,
          enabled: this.formEnabled,
        })
        .subscribe({
          next: () => {
            this.toast.sucesso("Account created.");
            this.closeDialog();
            this.loadAccounts();
          },
          error: (err) => {
            const msg =
              err?.error?.message ?? err?.message ?? "Could not create account.";
            this.toast.erro(msg);
          },
        });
      return;
    }
    if (this.editingRow) {
      const id = this.editingRow.id;
      const body: {
        accountEmail?: string | null;
        password?: string | null;
        enabled?: boolean | null;
      } = {
        accountEmail: this.formEmail.trim() || null,
        enabled: this.formEnabled,
      };
      if (this.formPassword.trim().length > 0) {
        body.password = this.formPassword;
      }
      this.accountApi.update(id, body).subscribe({
        next: () => {
          this.toast.sucesso("Account updated.");
          this.closeDialog();
          this.loadAccounts();
        },
        error: (err) => {
          const msg =
            err?.error?.message ?? err?.message ?? "Could not update account.";
          this.toast.erro(msg);
        },
      });
    }
  }

  remove(row: SmartPlugAccountDto): void {
    if (!this.canAdmin) {
      return;
    }
    if (!confirm(`Delete default account ${row.vendor} for this box?`)) {
      return;
    }
    this.accountApi.delete(row.id).subscribe({
      next: () => {
        this.toast.sucesso("Account removed.");
        this.loadAccounts();
      },
      error: () => this.toast.erro("Could not delete account."),
    });
  }
}
