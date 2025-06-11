import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimengModule } from '@app/shared/primeng/primeng.module';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { TableComponent } from '@app/shared/components/table/table.component';
import { MonitorService } from '@app/core/service/api/monitor.service';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { DialogoUtils } from '@app/shared/utils/dialogo-config.utils';
import { DialogoComponent } from '@app/shared/components/dialogo/dialogo.component';
import { ToastService } from '@app/core/service/state/toast.service';
import { IColumn } from '@app/shared/utils/table.utils';
import { finalize } from 'rxjs/operators';
import { Monitor, MonitorType } from '@app/model/monitors';
import { DefaultStatus } from '@app/model/client';

@Component({
  selector: 'app-management-monitors',
  standalone: true,
  imports: [
    CommonModule,
    PrimengModule,
    FormsModule,
    ReactiveFormsModule,
    TableComponent
  ],
  templateUrl: './management-monitors.component.html',
  styleUrls: ['./management-monitors.component.scss'],
  providers: [DialogService, DialogoUtils]
})
export class ManagementMonitorsComponent implements OnInit {
  @ViewChild(TableComponent) table: TableComponent;
  
  monitors: Monitor[] = [];
  selectedMonitor: Monitor | null = null;
  loading = false;
  searchText = '';
  totalRecords = 0;
  showDialog = false;
  isCreating = false;
  monitorForm: FormGroup;
  dialogRef: DynamicDialogRef;
  
  colunas: IColumn[] = [
    { header: 'ID', body: 'id', sortable: true },
    { header: 'Name', body: 'name', sortable: true },
    { header: 'Location', body: 'location', sortable: true },
    { header: 'Type', body: 'type', sortable: true },
    { header: 'Status', body: 'status', sortable: true },
    { header: 'Last Update', body: 'lastUpdate', sortable: true, sortType: 'date' },
    { header: 'Actions', body: 'actions', typeContent: 'acoes-personalizadas' }
  ];

  monitorTypes = Object.values(MonitorType);
  statusOptions = [
    { label: 'Active', value: DefaultStatus.ACTIVE },
    { label: 'Inactive', value: DefaultStatus.INACTIVE }
  ];

  constructor(
    private readonly monitorService: MonitorService,
    private readonly formBuilder: FormBuilder,
    private readonly dialogService: DialogService,
    private readonly toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadMonitors();
  }

  initForm(monitor?: Monitor): void {
    this.monitorForm = this.formBuilder.group({
      name: [monitor?.name || '', [Validators.required]],
      location: [monitor?.location || '', [Validators.required]],
      type: [monitor?.type || MonitorType.BASIC, [Validators.required]],
      status: [monitor?.status || DefaultStatus.ACTIVE, [Validators.required]],
      locationDescription: [monitor?.locationDescription || ''],
      size: [monitor?.size || 42.0, [Validators.required, Validators.min(1)]],
      productId: [monitor?.productId || '', [Validators.required]],
      maxBlocks: [monitor?.maxBlocks || 12, [Validators.required, Validators.min(1)]],
      active: [monitor?.active !== undefined ? monitor.active : true]
    });
  }

  loadMonitors(): void {
    this.loading = true;
    this.monitorService.getMonitors(this.searchText)
      .pipe(finalize(() => this.loading = false))
      .subscribe(data => {
        this.monitors = data;
        this.totalRecords = data.length;
      });
  }

  searchMonitors(): void {
    this.loadMonitors();
  }

  clearSearch(): void {
    this.searchText = '';
    this.loadMonitors();
  }

  onPageChange(event: any): void {
    console.log('Página alterada:', event);
    // Implementar paginação se necessário
  }

  visualizarMonitor(id: string): void {
    this.monitorService.getMonitorById(id).subscribe(monitor => {
      if (monitor) {
        this.selectedMonitor = monitor;
        this.showMonitorDetails(monitor);
      }
    });
  }

  editarMonitor(id: string): void {
    this.monitorService.getMonitorById(id).subscribe(monitor => {
      if (monitor) {
        this.selectedMonitor = monitor;
        this.isCreating = false;
        this.initForm(monitor);
        this.showDialog = true;
      }
    });
  }

  excluirMonitor(id: string): void {
    const config = DialogoUtils.exibirAlerta('Are you sure you want to delete this monitor?', {
      acaoPrimaria: 'Yes, delete',
      acaoPrimariaCallback: () => {
        this.dialogRef.close();
        this.confirmDeleteMonitor(id);
      },
      acaoSecundaria: 'Cancel',
      acaoSecundariaCallback: () => {
        this.dialogRef.close();
      }
    });

    this.dialogRef = this.dialogService.open(DialogoComponent, config);
  }

  confirmDeleteMonitor(id: string): void {
    this.loading = true;
    this.monitorService.deleteMonitor(id)
      .pipe(finalize(() => this.loading = false))
      .subscribe(success => {
        if (success) {
          this.toastService.sucesso('Monitor deleted successfully');
          this.loadMonitors();
        } else {
          this.toastService.erro('Error deleting monitor');
        }
      });
  }

  createMonitor(): void {
    this.selectedMonitor = null;
    this.isCreating = true;
    this.initForm();
    this.showDialog = true;
  }

  saveMonitor(): void {
    if (this.monitorForm.invalid) {
      this.monitorForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    const monitorData = this.monitorForm.value;

    // Adicionando os campos necessários para corresponder à interface Monitor
    const monitor: Partial<Monitor> = {
      ...monitorData,
      // Criando um endereço vazio para o novo monitor
      address: {
        id: '',
        street: '',
        city: '',
        state: '',
        country: '',
        zipCode: ''
      }
    };

    if (this.isCreating) {
      this.monitorService.createMonitor(monitor as Omit<Monitor, 'id'>)
        .pipe(finalize(() => {
          this.loading = false;
          this.showDialog = false;
        }))
        .subscribe(createdMonitor => {
          this.toastService.sucesso('Monitor created successfully');
          this.loadMonitors();
        });
    } else if (this.selectedMonitor) {
      this.monitorService.updateMonitor(this.selectedMonitor.id, monitor)
        .pipe(finalize(() => {
          this.loading = false;
          this.showDialog = false;
        }))
        .subscribe(updatedMonitor => {
          this.toastService.sucesso('Monitor updated successfully');
          this.loadMonitors();
        });
    }
  }

  showMonitorDetails(monitor: Monitor): void {
    const config = {
      header: 'Monitor Details',
      width: '500px',
      data: {
        monitor
      }
    };

    this.dialogRef = this.dialogService.open(DialogoComponent, config);
  }

  hideDialog(): void {
    this.showDialog = false;
  }
}
