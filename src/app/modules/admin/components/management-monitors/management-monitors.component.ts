import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimengModule } from '@app/shared/primeng/primeng.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-management-monitors',
  standalone: true,
  imports: [
    CommonModule,
    PrimengModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './management-monitors.component.html',
  styleUrls: ['./management-monitors.component.scss']
})
export class ManagementMonitorsComponent implements OnInit {
  loading: boolean = false;
  monitors: any[] = [];
  selectedMonitor: any = null;

  constructor() { }

  ngOnInit(): void {
    this.loadMonitors();
  }

  loadMonitors(): void {
    this.loading = true;
    // Aqui será implementada a lógica para carregar monitores da API
    setTimeout(() => {
      this.monitors = [
        { id: 1, name: 'Monitor 1', status: 'active', lastUpdate: new Date() },
        { id: 2, name: 'Monitor 2', status: 'inactive', lastUpdate: new Date() },
        { id: 3, name: 'Monitor 3', status: 'active', lastUpdate: new Date() }
      ];
      this.loading = false;
    }, 1000);
  }

  onSelectMonitor(monitor: any): void {
    this.selectedMonitor = monitor;
  }

  createMonitor(): void {
    // Implementação futura para criar um novo monitor
  }

  updateMonitor(monitor: any): void {
    // Implementação futura para atualizar um monitor existente
  }

  deleteMonitor(monitorId: number): void {
    // Implementação futura para excluir um monitor
  }
}
