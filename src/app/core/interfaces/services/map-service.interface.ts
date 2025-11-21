import { MapPoint } from "@app/core/service/state/map-point.interface";

export interface IMapService {
  initializeMap(
    container: HTMLElement,
    center: { lat: number; lng: number },
    zoom: number
  ): Promise<any>;

  addMarker(
    point: MapPoint,
    onClick?: (point: MapPoint) => void
  ): any;

  removeMarker(marker: any): void;

  clearAllMarkers(): void;

  fitBounds(points: MapPoint[]): void;

  setCenter(center: { lat: number; lng: number }): void;

  setZoom(zoom: number): void;

  getZoom(): number;

  onZoomChange(callback: (zoom: number) => void): void;

  onMapClick(callback: (event: any) => void): void;

  getMapInstance(): any;
}

