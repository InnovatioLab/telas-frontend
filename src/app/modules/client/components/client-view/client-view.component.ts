import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild, AfterViewInit } from '@angular/core';
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
export class ClientViewComponent implements OnInit, OnDestroy, AfterViewInit {
  isLoading = true;
  showPointMenu = false;
  menuPosition = { x: 0, y: 0 };
  selectedPoint: MapPoint | null = null;
  savedPoints: MapPoint[] = [];

  @ViewChild(MapaComponent) mapaComponent!: MapaComponent;
  private activeMarkers: L.Marker[] = [];

  constructor(
    private readonly plotService: PlotMapaService,
    private readonly toastService: ToastService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadNearbyPoints();
  }

  ngAfterViewInit(): void {
    // Quando o mapa estiver pronto, podemos plotar os pontos
    if (this.mapaComponent?.getMapInstance()) {
      this.plotSavedPoints();
    } else {
      setTimeout(() => this.plotSavedPoints(), 500);
    }
  }

  ngOnDestroy(): void {}

  private plotSavedPoints(): void {
    if (!this.mapaComponent?.getMapInstance()) return;
    const map = this.mapaComponent.getMapInstance()!;
    // Limpa marcadores antigos
    this.activeMarkers.forEach(marker => marker.removeFrom(map));
    this.activeMarkers = [];
    // Plota os pontos salvos
    this.savedPoints.forEach(point => {
      const marker = this.plotService.plotMarker(
        map,
        point.latitude,
        point.longitude,
        point.title || '',
        () => this.handlePointClick({ point, event: new MouseEvent('click') })
      );
      if (marker) this.activeMarkers.push(marker);
    });
  }

  private setMapPoints(points: MapPoint[]): void {
    if (!this.mapaComponent?.getMapInstance()) return;
    const map = this.mapaComponent.getMapInstance()!;
    this.activeMarkers.forEach(marker => marker.removeFrom(map));
    this.activeMarkers = [];
    points.forEach(point => {
      const marker = this.plotService.plotMarker(
        map,
        point.latitude,
        point.longitude,
        point.title || '',
        () => this.handlePointClick({ point, event: new MouseEvent('click') })
      );
      if (marker) this.activeMarkers.push(marker);
    });
  }

  private loadNearbyPoints(): void {
    this.isLoading = true;
    this.getCurrentLocation()
      .then(location => {
        // Aqui você deve buscar os pontos próximos via API ou serviço
        // Simulação:
        const fakePoints: MapPoint[] = [
          { latitude: location.latitude, longitude: location.longitude, title: 'Você está aqui' }
        ];
        this.setMapPoints(fakePoints);
        this.isLoading = false;
      })
      .catch(error => {
        this.toastService.erro(error.message);
        this.isLoading = false;
      });
  }

  private getCurrentLocation(): Promise<{ latitude: number; longitude: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocalização não é suportada pelo seu navegador.'));
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
          reject(new Error('Não foi possível obter sua localização. Verifique as permissões.'));
        }
      );
    });
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
    console.log('Mostrando detalhes de:', point);
  }

  addPointToList(point: MapPoint): void {
    if (!this.savedPoints.some(p => p.title === point.title)) {
      this.savedPoints.push(point);
      this.toastService.sucesso(`${point.title} adicionado à sua lista!`);
      this.plotSavedPoints();
    } else {
      this.toastService.aviso(`${point.title} já está na sua lista.`);
    }
    this.showPointMenu = false;
  }
}