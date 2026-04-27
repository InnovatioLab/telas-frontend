import { CommonModule } from "@angular/common";
import { Component, OnInit, signal } from "@angular/core";
import { RouterModule } from "@angular/router";
import {
  SmartPlugAdminDto,
  SmartPlugAdminService,
} from "@app/core/service/api/smart-plug-admin.service";
import { Authentication } from "@app/core/service/auth/autenthication";
import { ToastService } from "@app/core/service/state/toast.service";
import { hasMonitoringPermission } from "@app/core/utils/monitoring-permission.util";
import { MonitoringPermission } from "@app/model/monitoring-permission";
import { PrimengModule } from "@app/shared/primeng/primeng.module";
import { RegisterSmartPlugModalComponent } from "../register-smart-plug-modal/register-smart-plug-modal.component";
import { ManagementSmartPlugAccountsComponent } from "../management-smart-plug-accounts/management-smart-plug-accounts.component";
import { ManagementSmartPlugsComponent } from "../management-smart-plugs/management-smart-plugs.component";

@Component({
  selector: "app-smart-plugs-hub",
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    PrimengModule,
    RegisterSmartPlugModalComponent,
    ManagementSmartPlugAccountsComponent,
    ManagementSmartPlugsComponent,
  ],
  templateUrl: "./smart-plugs-hub.component.html",
  styleUrls: ["./smart-plugs-hub.component.scss"],
})
export class SmartPlugsHubComponent implements OnInit {
  readonly inventoryLoading = signal(false);
  readonly inventory = signal<SmartPlugAdminDto[]>([]);
  readonly registerVisible = signal(false);

  constructor(
    private readonly smartPlugAdmin: SmartPlugAdminService,
    private readonly toast: ToastService,
    private readonly authentication: Authentication
  ) {}

  get canInventoryCreate(): boolean {
    return hasMonitoringPermission(
      this.authentication.client(),
      MonitoringPermission.MONITORING_SMART_PLUG_INVENTORY_CREATE
    );
  }

  get canAccountsManage(): boolean {
    return hasMonitoringPermission(
      this.authentication.client(),
      MonitoringPermission.MONITORING_SMART_PLUG_ACCOUNTS_MANAGE
    );
  }

  ngOnInit(): void {
    this.loadInventory();
  }

  openRegister(): void {
    if (!this.canInventoryCreate) {
      this.toast.aviso("Sem permissão para registrar tomadas no inventário.");
      return;
    }
    this.registerVisible.set(true);
  }

  closeRegister(): void {
    this.registerVisible.set(false);
  }

  onRegistered(dto: SmartPlugAdminDto): void {
    const existing = this.inventory();
    this.inventory.set([dto, ...existing]);
    this.toast.sucesso("Saved to inventory.");
  }

  loadInventory(): void {
    this.inventoryLoading.set(true);
    this.smartPlugAdmin.list().subscribe({
      next: (list) => {
        this.inventory.set(list ?? []);
        this.inventoryLoading.set(false);
      },
      error: () => {
        this.inventoryLoading.set(false);
        this.toast.erro("Could not load smart plug inventory.");
      },
    });
  }
}

