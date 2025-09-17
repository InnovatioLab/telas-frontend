import { CommonModule } from "@angular/common";
import {
  AfterViewInit,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Subscription } from "rxjs";
import { GoogleMapsService } from "../../../../core/service/api/google-maps.service";
import { LoadingService } from "../../../../core/service/state/loading.service";
import { MapPoint } from "../../../../core/service/state/map-point.interface";
import { SidebarMapaComponent } from "../../../../shared/components/sidebar-mapa/sidebar-mapa.component";
import { LeafletMapsComponent } from "@app/shared/components/leaflet-maps/leaflet-maps.component";
import { PopUpStepAddListComponent } from "@app/shared/components/pop-up-add-list/pop-up-add-list.component";

@Component({
  selector: "app-admin-view",
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarMapaComponent, LeafletMapsComponent, PopUpStepAddListComponent],
  templateUrl: "./admin-view.component.html",
  styleUrls: ["./admin-view.component.scss"],
})
export class AdminViewComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild(LeafletMapsComponent) mapComponent!: LeafletMapsComponent;

  monitors: MapPoint[] = [];
  mapCenter: { lat: number; lng: number } | null = null;
  showPointMenu = false;
  menuPosition = { x: 0, y: 0 };
  selectedPoint: MapPoint | null = null;
  private readonly subscriptions: Subscription[] = [];

  constructor(
    private readonly googleMapsService: GoogleMapsService,
    private readonly loadingService: LoadingService
  ) {}

  ngOnInit(): void {
    this.loadNearbyPoints();
    this.setupEventListeners();
  }

  ngAfterViewInit(): void {
    // Inicializa o mapa com os pontos existentes após o componente ser criado
    setTimeout(() => {
      this.updateMapMarkers();
    }, 100);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  private setupEventListeners(): void {
    const userCoordsSub = this.googleMapsService.savedPoints$.subscribe(
      (points) => {
        if (points.length > 0) {
          const lastPoint = points[points.length - 1];
          this.mapCenter = {
            lat: lastPoint.latitude,
            lng: lastPoint.longitude,
          };
          this.loadNearbyPoints();
        }
      }
    );

    this.subscriptions.push(userCoordsSub);
  }

  private loadNearbyPoints(): void {
    if (!this.mapCenter) return;

    this.loadingService.setLoading(true, "load-nearby-points");

    this.googleMapsService
      .findNearbyMonitors(this.mapCenter.lat, this.mapCenter.lng)
      .then((monitors) => {
        this.monitors = monitors;
        this.updateMapMarkers();
        this.loadingService.setLoading(false, "load-nearby-points");
      })
      .catch((error) => {
        this.loadingService.setLoading(false, "load-nearby-points");
      });
  }

  private updateMapMarkers(): void {
    if (!this.mapComponent) return;

    this.mapComponent.clearMarkers();
    
    this.monitors.forEach(monitor => {
      this.mapComponent.addMarker(
        monitor.latitude,
        monitor.longitude,
        monitor.title || 'Monitor',
        () => this.handleMarkerClick(monitor)
      );
    });
  }

  handleMarkerClick(point: MapPoint): void {
    this.selectedPoint = point;
    this.showPointMenu = true;
    // TODO: Implementar lógica para posicionar o menu próximo ao marcador
    this.menuPosition = { x: 100, y: 100 };
  }

  showPointDetails(point: MapPoint): void {
    // TODO: Implementar lógica para mostrar detalhes do ponto
    console.log('Mostrar detalhes do ponto:', point);
  }

  addPointToList(point: MapPoint): void {
    // TODO: Implementar lógica para adicionar ponto à lista
    console.log('Adicionar ponto à lista:', point);
  }
}
