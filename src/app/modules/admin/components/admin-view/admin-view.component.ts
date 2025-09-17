import { CommonModule } from "@angular/common";
import { AfterViewInit, Component, OnDestroy, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { LoadingService } from "../../../../core/service/state/loading.service";
import { MapPoint } from "../../../../core/service/state/map-point.interface";
import { PopUpStepAddListComponent } from "../../../../shared/components/pop-up-add-list/pop-up-add-list.component";
import { SidebarMapaComponent } from "../../../../shared/components/sidebar-mapa/sidebar-mapa.component";
import * as L from 'leaflet';
import { Subscription } from "rxjs";
import { SearchMonitorsService } from "@app/core/service/api/search-monitors.service";
import { LeafletMapService, MapMarker } from "@app/core/service/state/leaflet-map.service";

@Component({
  selector: "app-admin-view",
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarMapaComponent, PopUpStepAddListComponent],
  templateUrl: "./admin-view.component.html",
  styleUrls: ["./admin-view.component.scss"],
})
export class AdminViewComponent implements OnInit, OnDestroy, AfterViewInit {
  monitors: MapPoint[] = [];
  mapCenter: L.LatLngExpression = [34.0522, -118.2437];
  showPointMenu = false;
  menuPosition = { x: 0, y: 0 };
  selectedPoint: MapPoint | null = null;
  private monitorSubscription: Subscription;

  constructor(
    private readonly loadingService: LoadingService,
    private readonly leafletMapService: LeafletMapService,
    private readonly searchMonitorsService: SearchMonitorsService 
  ) {}

  ngOnInit(): void {
    this.monitorSubscription = this.leafletMapService.monitorsFound$.subscribe(monitors => {
      this.monitors = monitors;
      this.updateMapMarkers();
    });
  }

  ngAfterViewInit(): void {
    this.leafletMapService.initializeMap('map-container', this.mapCenter, 12);
  }

  ngOnDestroy(): void {
    this.leafletMapService.destroyMap();
    if (this.monitorSubscription) {
      this.monitorSubscription.unsubscribe();
    }
  }

  private updateMapMarkers(): void {
    const markers: MapMarker[] = this.monitors.map(monitor => ({
      position: [monitor.latitude, monitor.longitude],
      title: monitor.title || 'Monitor',
      data: monitor
    }));
    this.leafletMapService.plotMarkers(markers, (point) => this.handleMarkerClick(point));
  }

  handleMarkerClick(point: MapPoint): void {
    this.selectedPoint = point;
    this.showPointMenu = true;
    this.menuPosition = { x: 100, y: 100 };
  }

  showPointDetails(point: MapPoint): void {}
  addPointToList(point: MapPoint): void {}
}