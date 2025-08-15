import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import * as L from 'leaflet';
import { PlotMapaService } from '@app/core/service/api/plot-mapa.service';
import { PrimengModule } from '@app/shared/primeng/primeng.module';
import { MapaComponent } from '@app/shared/components/mapa/mapa.component';
import { SidebarMapaComponent } from '@app/shared/components/sidebar-mapa/sidebar-mapa.component';
import { RodapeComponent } from '@app/shared/components/rodape/rodape.component';
import { PopUpStepAddListComponent } from '@app/shared/components/pop-up-add-list/pop-up-add-list.component';
import { ToastService } from '@app/core/service/state/toast.service';
import { MapPoint } from '@app/core/service/state/map-point.interface';

@Component({
  selector: "feat-client-view",
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    PrimengModule,
    MapaComponent,
    SidebarMapaComponent,
    RodapeComponent,
    PopUpStepAddListComponent,
  ],
  templateUrl: "./client-view.component.html",
  styleUrls: ["./client-view.component.scss"],
})
export class ClientViewComponent implements OnInit, OnDestroy {
  isLoading = true;
  showPointMenu = false;
  menuPosition = { x: 0, y: 0 };
  selectedPoint: MapPoint | null = null;
  savedPoints: MapPoint[] = [];

  private mapInstance: L.Map | null = null;
  private activeMarkers: L.Marker[] = [];

  constructor(
    private readonly plotService: PlotMapaService,
    private readonly toastService: ToastService,
    private readonly cdr: ChangeDetectorRef,
    private readonly mapsService: MapsService
  ) {}

  ngOnInit(): void {
    window.addEventListener("monitors-found", this.handleMonitorsFound);
    this.loadNearbyPoints();
  }

  ngOnDestroy(): void {
    window.removeEventListener("monitors-found", this.handleMonitorsFound);
  }

  onMapInitialized(map: L.Map): void {
    this.mapInstance = map;
    this.isLoading = false;
    this.cdr.detectChanges();
  }

  private readonly handleMonitorsFound = (e: Event): void => {
    const customEvent = e as CustomEvent;
    if (customEvent.detail?.monitors) {
      this.setMapPoints(customEvent.detail.monitors);
    }
  };

  private setMapPoints(points: MapPoint[]): void {
    if (!this.mapInstance) return;

    this.activeMarkers.forEach(marker => marker.removeFrom(this.mapInstance));
    this.activeMarkers = [];

    points.forEach(point => {
      const marker = this.plotService.plotMarker(
        this.mapInstance,
        point.latitude,
        point.longitude,
        point.title || ''
      );

      if (marker) {
        marker.on('click', (e: L.LeafletMouseEvent) => {
          this.handlePointClick({ point, event: e.originalEvent });
        });
        this.activeMarkers.push(marker);
      }
    });
  }

  private loadNearbyPoints(): void {
    this.isLoading = true;
    this.getCurrentLocation()
      .then(location => {
        this.findNearbyPoints(location.latitude, location.longitude);
      })
      .catch(error => {
        this.toastService.erro(error.message);
        this.isLoading = false;
      });
  }

  private getCurrentLocation(): Promise<{ latitude: number; longitude: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocalização não é suportada pelo seu navegador."));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        position => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        () => {
          reject(new Error("Não foi possível obter sua localização. Verifique as permissões."));
        }
      );
    });
  }

  private findNearbyPoints(latitude: number, longitude: number): void {
    this.mapsService
      .findNearbyMonitors(latitude, longitude)
      .then((monitors: MapPoint[]) => {
        if (monitors && monitors.length > 0) {
          this.emitMonitorsFoundEvent(monitors);
        }
        this.isLoading = false;
      })
      .catch((error: Error) => {
        this.toastService.erro("Error searching for nearby monitors");
        this.isLoading = false;
      });
  }

  private emitMonitorsFoundEvent(monitors: MapPoint[]): void {
    const event = new CustomEvent("monitors-found", { detail: { monitors } });
    window.dispatchEvent(event);
  }

  handlePointClick(data: { point: MapPoint; event: MouseEvent }): void {
    this.selectedPoint = data.point;
    this.menuPosition = { x: data.event.clientX, y: data.event.clientY };
    this.showPointMenu = true;
    data.event.stopPropagation();
  }

  showPointDetails(point: MapPoint): void {
    this.selectedPoint = point;
    this.showPointMenu = false;
    // Aqui você pode adicionar lógica para, por exemplo, abrir um sidebar com os detalhes
    console.log("Mostrando detalhes de:", point);
  }

  addPointToList(point: MapPoint): void {
    // Verifica se o ponto já não foi adicionado
    if (!this.savedPoints.some(p => p.title === point.title)) { // Lógica de comparação simples
        this.savedPoints.push(point);
        this.toastService.sucesso(`${point.title} adicionado à sua lista!`);
    } else {
        this.toastService.aviso(`${point.title} já está na sua lista.`);
    }
    this.showPointMenu = false;
  }
}