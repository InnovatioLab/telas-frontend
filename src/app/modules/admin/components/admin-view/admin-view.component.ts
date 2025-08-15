import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MapPoint } from '../../../../core/service/state/map-point.interface';
import { PlotMapaService } from '../../../../core/service/api/plot-mapa.service';
import { MapaComponent } from '../../../../shared/components/mapa/mapa.component';
import { SidebarMapaComponent } from '../../../../shared/components/sidebar-mapa/sidebar-mapa.component';
import { PopUpStepAddListComponent } from '../../../../shared/components/pop-up-add-list/pop-up-add-list.component';
import { AlertAdminSidebarComponent } from '../../../../shared/components/alert-admin-sidebar/alert-admin-sidebar.component';

@Component({
  selector: 'app-admin-view',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MapaComponent,
    SidebarMapaComponent,
  PopUpStepAddListComponent,
    AlertAdminSidebarComponent
  ],
  templateUrl: './admin-view.component.html',
  styleUrls: ['./admin-view.component.scss']
})
export class AdminViewComponent implements OnInit, OnDestroy, AfterViewInit {
  monitors: MapPoint[] = [];
  showPointMenu = false;
  menuPosition = { x: 0, y: 0 };
  selectedPoint: MapPoint | null = null;
  userName = '';

  constructor(private readonly plotService: PlotMapaService) {}

  ngOnInit(): void {
    this.loadNearbyPoints();
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {}

  private loadNearbyPoints(): void {
    // Simulação de monitores próximos
    this.monitors = [
      { latitude: -15.78, longitude: -47.92, title: 'Monitor 1', data: { type: 'Tipo A' } },
      { latitude: -15.79, longitude: -47.93, title: 'Monitor 2', data: { type: 'Tipo B' } }
    ];
  }

  onAdminSidebarVisibilityChange(event: any): void {
    // Lógica para visibilidade do sidebar admin
  }

  showPointDetails(point: MapPoint): void {
    this.selectedPoint = point;
    this.showPointMenu = false;
    // Lógica para mostrar detalhes do ponto
  }

  addPointToList(point: MapPoint): void {
    // Lógica para adicionar ponto à lista
    this.showPointMenu = false;
  }

  handlePointClick(event: any): void {
    // Lógica para clique no ponto do mapa
  }

  handleMarkerClick(event: any): void {
    // Lógica para clique no marcador do mapa
  }
}
