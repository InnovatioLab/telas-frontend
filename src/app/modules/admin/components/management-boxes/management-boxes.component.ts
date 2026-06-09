import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ClientService } from "@app/core/service/api/client.service";
import { BoxService } from "@app/core/service/api/box.service";
import { MonitorService } from "@app/core/service/api/monitor.service";
import {
  SmartPlugAdminDto,
  SmartPlugAdminService,
} from "@app/core/service/api/smart-plug-admin.service";
import { ToastService } from "@app/core/service/state/toast.service";
import { Box } from "@app/model/box";
import { BoxAddress } from "@app/model/box-address";
import { BoxAddressRequestDto } from "@app/model/dto/request/box-address-request.dto";
import { BoxRequestDto } from "@app/model/dto/request/box-request.dto";
import { FilterBoxRequestDto } from "@app/model/dto/request/filter-box-request.dto";
import { IconsModule } from "@app/shared/icons/icons.module";
import { PrimengModule } from "@app/shared/primeng/primeng.module";
import { LazyTableController, LazyTableFilterState } from "@app/shared/utils/lazy-table.controller";
import { TableLazyPageEvent } from "@app/shared/utils/table-lazy-pagination.utils";
import { MessageService, OverlayOptions } from "primeng/api";
import { Role } from "@app/model/client";
import { Observable, of } from "rxjs";
import { filter, map, switchMap, take } from "rxjs/operators";

@Component({
  selector: "app-management-boxes",
  standalone: true,
  imports: [CommonModule, PrimengModule, FormsModule, IconsModule],
  templateUrl: "./management-boxes.component.html",
  styleUrls: ["./management-boxes.component.scss"],
})
export class ManagementBoxesComponent implements OnInit {
  readonly selectOverlayOptions: OverlayOptions = {
    appendTo: "body",
    baseZIndex: 11000,
  };

  availableBoxAddresses: BoxAddress[] = [];
  selectedBoxForEdit: Box | null = null;
  selectedBoxAddress: BoxAddress | null = null;
  createBoxModalVisible = false;
  editBoxModalVisible = false;
  searchTerm = "";

  readonly tableController: LazyTableController<
    Box,
    FilterBoxRequestDto & LazyTableFilterState
  >;

  newBox: BoxRequestDto = {
    boxAddressId: "",
    monitorId: "",
    active: true,
  };

  // Lista de monitores individuais para o select
  availableMonitors: Array<{ id: string; fullAddress: string }> = [];
  selectedMonitorIdCreate: string | null = null;
  selectedMonitorIdEdit: string | null = null;
  loadingMonitors = false;
  loadingBoxAddresses = false;

  isDeveloper = false;
  isAdmin = false;
  canViewBoxAddress = false;
  canCreateBoxAddress = false;
  canManageBoxAddress = false;

  boxAddressManagerVisible = false;
  allBoxAddresses: BoxAddress[] = [];
  loadingAllBoxAddresses = false;

  boxAddressForm: BoxAddressRequestDto = { ip: "", mac: "", dns: "" };
  editingBoxAddress: BoxAddress | null = null;
  savingBoxAddress = false;

  syncingBoxId: string | null = null;

  boxPlugOptions: { label: string; value: string }[] = [];
  selectedBoxSmartPlugId = "";
  initialBoxSmartPlugId: string | null = null;

  constructor(
    private readonly boxService: BoxService,
    private readonly monitorService: MonitorService,
    private readonly clientService: ClientService,
    private readonly smartPlugAdmin: SmartPlugAdminService,
    private readonly toastService: ToastService,
    private readonly messageService: MessageService
  ) {
    this.tableController = new LazyTableController<
      Box,
      FilterBoxRequestDto & LazyTableFilterState
    >(
      { page: 1, size: 10, sortBy: "active", sortDir: "desc" },
      (filters) =>
        this.boxService.getBoxesWithPagination(filters as FilterBoxRequestDto).pipe(
          map((result) => ({
            list: result.list,
            totalElements: result.totalElements,
          }))
        ),
      () => this.toastService.erro("Error loading boxes")
    );
  }

  get boxes(): Box[] {
    return this.tableController.items;
  }

  get loading(): boolean {
    return this.tableController.loading;
  }

  get totalRecords(): number {
    return this.tableController.totalRecords;
  }

  get currentFilters(): FilterBoxRequestDto & LazyTableFilterState {
    return this.tableController.currentFilters;
  }

  ngOnInit(): void {
    this.clientService.clientAtual$.pipe(filter(c => !!c), take(1)).subscribe((client) => {
      this.isDeveloper = client?.role === Role.DEVELOPER;
      this.isAdmin = client?.role === Role.ADMIN;
      const privs = this.isDeveloper || this.isAdmin;
      const perms: string[] = client?.permissions ?? [];
      this.canViewBoxAddress   = privs || perms.includes('ADMIN_BOX_ADDRESS_VIEW');
      this.canCreateBoxAddress = privs || perms.includes('ADMIN_BOX_ADDRESS_CREATE');
      this.canManageBoxAddress = privs || perms.includes('ADMIN_BOX_ADDRESS_MANAGE');
    });
    this.loadInitialData();
  }

  openBoxAddressManager(): void {
    this.editingBoxAddress = null;
    this.boxAddressForm = { ip: '', mac: '', dns: '' };
    this.loadAllBoxAddresses();
    this.boxAddressManagerVisible = true;
  }

  loadAllBoxAddresses(): void {
    this.loadingAllBoxAddresses = true;
    this.boxService.getAllBoxAddresses().subscribe({
      next: (list) => { this.allBoxAddresses = list; this.loadingAllBoxAddresses = false; },
      error: () => { this.toastService.erro('Error loading box addresses'); this.loadingAllBoxAddresses = false; },
    });
  }

  startEditBoxAddress(addr: BoxAddress): void {
    this.editingBoxAddress = { ...addr };
    this.boxAddressForm = { ip: addr.ip, mac: addr.mac, dns: addr.dns ?? '' };
  }

  cancelEditBoxAddress(): void {
    this.editingBoxAddress = null;
    this.boxAddressForm = { ip: '', mac: '', dns: '' };
  }

  saveBoxAddress(): void {
    if (!this.boxAddressForm.ip?.trim() || !this.boxAddressForm.mac?.trim()) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'IP and MAC are required' });
      return;
    }
    this.savingBoxAddress = true;
    const dto: BoxAddressRequestDto = {
      ip: this.boxAddressForm.ip.trim(),
      mac: this.boxAddressForm.mac.trim(),
      dns: this.boxAddressForm.dns?.trim() || undefined,
    };
    const req$ = this.editingBoxAddress
      ? this.boxService.updateBoxAddress(this.editingBoxAddress.id, dto)
      : this.boxService.createBoxAddress(dto);
    req$.subscribe({
      next: () => {
        this.savingBoxAddress = false;
        const msg = this.editingBoxAddress ? 'Address updated!' : 'Address created!';
        this.cancelEditBoxAddress();
        this.loadAllBoxAddresses();
        this.messageService.add({ severity: 'success', summary: 'Success', detail: msg });
      },
      error: () => { this.savingBoxAddress = false; this.toastService.erro('Error saving address'); },
    });
  }

  deleteBoxAddress(addr: BoxAddress): void {
    if (addr.inUse) { return; }
    this.boxService.deleteBoxAddress(addr.id).subscribe({
      next: () => {
        this.loadAllBoxAddresses();
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Address deleted!' });
      },
      error: () => { this.toastService.erro('Error deleting address. It may be in use.'); },
    });
  }

  loadInitialData(): void {
    this.tableController.setSearchTerm(this.searchTerm);
    this.tableController.load();
  }

  loadAvailableBoxAddresses(): void {
    this.loadingBoxAddresses = true;
    this.boxService.getAvailableBoxAddresses().subscribe({
      next: (boxAddresses) => {
        this.availableBoxAddresses = boxAddresses || [];
        this.loadingBoxAddresses = false;
      },
      error: (error) => {
        this.toastService.erro("Error loading box addresses");
        this.loadingBoxAddresses = false;
      },
    });
  }

  loadAvailableBoxAddressesForEdit(currentBox: Box): void {
    this.loadingBoxAddresses = true;
    this.boxService.getAvailableBoxAddresses().subscribe({
      next: (boxAddresses) => {
        this.availableBoxAddresses = boxAddresses || [];

        const currentBoxAddress: BoxAddress = {
          id: currentBox.boxAddressId || "",
          ip: currentBox.ip,
          mac: currentBox.macAddress || "",
        };

        const existsInList = this.availableBoxAddresses.some(
          (addr) => addr.ip === currentBox.ip
        );

        if (!existsInList) {
          this.availableBoxAddresses.unshift(currentBoxAddress);
        }

        const boxAddress = this.availableBoxAddresses.find(
          (addr) => addr.ip === currentBox.ip
        );

        if (boxAddress) {
          this.selectedBoxAddress = boxAddress;
          if (this.selectedBoxForEdit) {
            this.selectedBoxForEdit.boxAddressId = boxAddress.id;
          }
        }

        this.loadingBoxAddresses = false;
      },
      error: (error) => {
        this.toastService.erro("Error loading box addresses");
        this.loadingBoxAddresses = false;
      },
    });
  }

  loadAvailableMonitors(): void {
    if (this.loadingMonitors) {
      return;
    }

    this.loadingMonitors = true;
    const editMonitorId = this.selectedBoxForEdit?.monitorIds?.[0] ?? null;

    this.boxService.getAvailableMonitors().subscribe({
      next: (monitors) => {
        this.availableMonitors = [];

        if (monitors && Array.isArray(monitors)) {
          monitors.forEach((monitor) => {
            if (monitor && monitor.id && monitor.fullAddress) {
              if (!monitor.hasBox || monitor.id === editMonitorId) {
                this.availableMonitors.push({
                  id: monitor.id,
                  fullAddress: monitor.fullAddress,
                });
              }
            }
          });
        }

        if (
          this.selectedBoxForEdit &&
          this.selectedBoxForEdit.monitorIds?.length > 0
        ) {
          this.selectedMonitorIdEdit = this.selectedBoxForEdit.monitorIds[0];
        } else {
          this.selectedMonitorIdEdit = null;
        }

        this.loadingMonitors = false;
      },
      error: (error) => {
        console.error("Error loading monitors:", error);
        this.toastService.erro("Error loading monitors");
        this.loadingMonitors = false;
      },
      complete: () => {
        if (this.loadingMonitors) {
          this.loadingMonitors = false;
        }
      },
    });
  }

  syncPlaylist(box: Box): void {
    if (this.syncingBoxId) return;
    this.syncingBoxId = box.id;
    this.boxService.syncPlaylist(box.id).subscribe({
      next: () => {
        this.syncingBoxId = null;
        this.messageService.add({
          severity: "success",
          summary: "Success",
          detail: "Playlist sync triggered successfully.",
        });
      },
      error: () => {
        this.syncingBoxId = null;
        this.toastService.erro("Error syncing playlist. The box may be offline.");
      },
    });
  }

  onBoxAddressChange(selectedBoxAddress: BoxAddress): void {
    if (selectedBoxAddress) {
      this.newBox.boxAddressId = selectedBoxAddress.id;
    }
  }

  onEditBoxAddressChange(selectedBoxAddress: BoxAddress): void {
    if (selectedBoxAddress && this.selectedBoxForEdit) {
      this.selectedBoxForEdit.boxAddressId = selectedBoxAddress.id;
    }
  }

  loadBoxes(): void {
    this.tableController.setSearchTerm(this.searchTerm);
    this.tableController.load();
  }

  onSearch(): void {
    this.tableController.setSearchTerm(this.searchTerm);
    this.tableController.onSearch();
  }

  onPageChange(event: TableLazyPageEvent): void {
    this.tableController.setSearchTerm(this.searchTerm);
    this.tableController.onPageChange(event);
  }

  onSort(event: { field?: string; order?: number }): void {
    this.tableController.setSearchTerm(this.searchTerm);
    this.tableController.onSort(event);
  }

  openCreateBoxModal(): void {
    this.newBox = {
      boxAddressId: "",
      monitorId: "",
      active: true,
    };
    this.selectedBoxAddress = null;
    this.selectedMonitorIdCreate = null;
    this.loadAvailableBoxAddresses();
    this.loadAvailableMonitors();
    this.createBoxModalVisible = true;
  }

  onCreateBox(): void {
    if (!this.newBox.boxAddressId) {
      this.messageService.add({
        severity: "error",
        summary: "Error",
        detail: "Box Address is required",
      });
      return;
    }

    if (!this.selectedMonitorIdCreate) {
      this.messageService.add({
        severity: "error",
        summary: "Error",
        detail: "Monitor is required",
      });
      return;
    }

    this.createBox({
      boxAddressId: this.newBox.boxAddressId,
      monitorId: this.selectedMonitorIdCreate,
      active: this.newBox.active,
    });
  }

  createBox(boxRequest: BoxRequestDto): void {
    this.boxService.createBox(boxRequest).subscribe({
      next: (newBox) => {
        this.closeModal();
        this.messageService.add({
          severity: "success",
          summary: "Success",
          detail: "Box created successfully!",
        });
        this.loadBoxes();
      },
      error: (error) => {
        this.messageService.add({
          severity: "error",
          summary: "Error",
          detail: "Error creating box. Please check the data and try again.",
        });
      },
    });
  }

  closeModal(): void {
    this.createBoxModalVisible = false;
  }

  onCreateBoxModalClose(): void {
    this.createBoxModalVisible = false;
  }

  onBoxCreated(boxRequest: BoxRequestDto): void {
    this.createBox(boxRequest);
  }

  onEditBox(): void {
    if (!this.selectedBoxForEdit) return;

    if (!this.selectedBoxForEdit.boxAddressId) {
      this.messageService.add({
        severity: "error",
        summary: "Error",
        detail: "Box Address is required",
      });
      return;
    }

    if (!this.selectedMonitorIdEdit) {
      this.messageService.add({
        severity: "error",
        summary: "Error",
        detail: "Monitor is required",
      });
      return;
    }

    this.updateBox({
      id: this.selectedBoxForEdit.id,
      data: {
        boxAddressId: this.selectedBoxForEdit.boxAddressId,
        monitorId: this.selectedMonitorIdEdit,
        active: this.selectedBoxForEdit.active,
      },
    });
  }

  onSelectBox(box: Box): void {
    this.selectedBoxForEdit = { ...box };
    this.selectedBoxAddress = null;
    this.selectedBoxSmartPlugId = "";
    this.initialBoxSmartPlugId = null;
    this.boxPlugOptions = [];

    // Carrega os endereços disponíveis incluindo o atual e define a seleção automaticamente
    this.loadAvailableBoxAddressesForEdit(box);
    this.loadAvailableMonitors();
    this.clientService.clientAtual$.pipe(take(1)).subscribe((client) => {
      this.isDeveloper = client?.role === Role.DEVELOPER;
      if (this.isDeveloper && box.id) {
        this.loadBoxPlugOptions(box.id);
      }
    });

    this.editBoxModalVisible = true;
  }

  private loadBoxPlugOptions(boxId: string): void {
    this.smartPlugAdmin.listUnassigned(undefined, boxId).subscribe({
      next: (list) => {
        const linked = list.find((p) => p.boxId === boxId);
        this.initialBoxSmartPlugId = linked?.id ?? null;
        const selected = this.initialBoxSmartPlugId ?? "";
        this.selectedBoxSmartPlugId = selected;
        this.boxPlugOptions = [
          { label: "Nenhuma", value: "" },
          ...list.map((p) => ({
            label: this.formatPlugLabel(p),
            value: p.id,
          })),
        ];
      },
    });
  }

  private formatPlugLabel(p: SmartPlugAdminDto): string {
    const name = p.displayName?.trim() || p.macAddress;
    return `${name} — ${p.vendor} (${p.macAddress})`;
  }

  private applyBoxSmartPlugSelection(boxId: string): Observable<unknown> {
    const next = this.selectedBoxSmartPlugId || null;
    const prev = this.initialBoxSmartPlugId ?? null;
    if (next === prev) {
      return of(null);
    }
    let seq: Observable<unknown> = of(null);
    if (prev && prev !== next) {
      seq = seq.pipe(switchMap(() => this.smartPlugAdmin.unassign(prev)));
    }
    if (next && next !== prev) {
      seq = seq.pipe(
        switchMap(() => this.smartPlugAdmin.assignToBox(next, boxId))
      );
    }
    return seq;
  }

  updateBox(updateData: { id: string; data: BoxRequestDto }): void {
    this.boxService
      .updateBox(updateData.id, updateData.data)
      .pipe(
        switchMap(() =>
          this.isDeveloper
            ? this.applyBoxSmartPlugSelection(updateData.id)
            : of(null)
        )
      )
      .subscribe({
        next: () => {
          this.editBoxModalVisible = false;
          this.selectedBoxForEdit = null;
          this.messageService.add({
            severity: "success",
            summary: "Success",
            detail: "Box updated successfully!",
          });
          this.loadBoxes();
        },
        error: () => {
          this.messageService.add({
            severity: "error",
            summary: "Error",
            detail: "Error updating box. Please check the data and try again.",
          });
        },
      });
  }

  onEditBoxModalClose(): void {
    this.editBoxModalVisible = false;
    this.selectedBoxForEdit = null;
    this.selectedMonitorIdEdit = null;
  }

  onBoxUpdated(updateData: { id: string; data: BoxRequestDto }): void {
    this.updateBox(updateData);
  }

  deleteBox(id: string): void {
    this.boxService.deleteBox(id).subscribe({
      next: (success) => {
        if (success) {
          this.messageService.add({
            severity: "success",
            summary: "Success",
            detail: "Box deleted successfully!",
          });
          this.loadBoxes();
        } else {
          this.messageService.add({
            severity: "error",
            summary: "Error",
            detail: "Error deleting box.",
          });
        }
      },
      error: (error) => {
        this.messageService.add({
          severity: "error",
          summary: "Error",
          detail: "Error deleting box.",
        });
      },
    });
  }

  getBoxDisplayName(box: Box): string {
    return `${box.ip} (${box.monitorCount || 0} monitors)`;
  }
}
