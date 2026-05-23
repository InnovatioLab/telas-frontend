import { Injectable } from "@angular/core";
import * as L from "leaflet";
import { MapPoint } from "@app/core/service/state/map-point.interface";

export interface MapMarkerIconOptions {
  useBrandMonitorColor: boolean;
  showMonitorHealth: boolean;
}

@Injectable({
  providedIn: "root",
})
export class MapMarkerIconService {
  private static readonly BRAND_MONITOR_COLOR = "#111519";
  private static readonly MONITOR_ICON_SIZE = 40;
  private static readonly MONITOR_ICON_HOVER_SIZE = 52;

  private monitorIcon: L.Icon | null = null;
  private monitorIconBrand: L.Icon | null = null;
  private monitorIconHealthy: L.Icon | null = null;
  private monitorIconUnhealthy: L.Icon | null = null;
  private monitorIconLarge: L.Icon | null = null;
  private monitorIconBrandLarge: L.Icon | null = null;
  private monitorIconHealthyLarge: L.Icon | null = null;
  private monitorIconUnhealthyLarge: L.Icon | null = null;
  private redMarkerIcon: L.Icon | null = null;

  constructor() {
    this.initializeIcons();
  }

  getBaseIconForPoint(
    point: MapPoint,
    options: MapMarkerIconOptions
  ): L.Icon {
    const isMonitor = point.category === "MONITOR" || point.type === "MONITOR";
    if (!isMonitor) {
      return this.redMarkerIcon!;
    }
    if (options.useBrandMonitorColor) {
      return this.monitorIconBrand!;
    }
    if (options.showMonitorHealth && point.healthOk === true) {
      return this.monitorIconHealthy!;
    }
    if (options.showMonitorHealth && point.healthOk === false) {
      return this.monitorIconUnhealthy!;
    }
    return this.monitorIcon!;
  }

  getHoverIconForPoint(
    point: MapPoint,
    options: MapMarkerIconOptions
  ): L.Icon {
    if (options.useBrandMonitorColor) {
      return this.monitorIconBrandLarge!;
    }
    if (options.showMonitorHealth && point.healthOk === true) {
      return this.monitorIconHealthyLarge!;
    }
    if (options.showMonitorHealth && point.healthOk === false) {
      return this.monitorIconUnhealthyLarge!;
    }
    return this.monitorIconLarge!;
  }

  getRedMarkerIcon(): L.Icon {
    return this.redMarkerIcon!;
  }

  private initializeIcons(): void {
    this.monitorIcon = this.createMonitorIconVariant(
      "#111519",
      "#111519",
      MapMarkerIconService.MONITOR_ICON_SIZE
    );
    this.monitorIconBrand = this.createMonitorIconVariant(
      MapMarkerIconService.BRAND_MONITOR_COLOR,
      MapMarkerIconService.BRAND_MONITOR_COLOR,
      MapMarkerIconService.MONITOR_ICON_SIZE
    );
    this.monitorIconHealthy = this.createMonitorIconVariant(
      "#1B5E20",
      "#A5D6A7",
      MapMarkerIconService.MONITOR_ICON_SIZE
    );
    this.monitorIconUnhealthy = this.createMonitorIconVariant(
      "#B71C1C",
      "#EF9A9A",
      MapMarkerIconService.MONITOR_ICON_SIZE
    );
    this.monitorIconLarge = this.createMonitorIconVariant(
      "#111519",
      "#111519",
      MapMarkerIconService.MONITOR_ICON_HOVER_SIZE
    );
    this.monitorIconBrandLarge = this.createMonitorIconVariant(
      MapMarkerIconService.BRAND_MONITOR_COLOR,
      MapMarkerIconService.BRAND_MONITOR_COLOR,
      MapMarkerIconService.MONITOR_ICON_HOVER_SIZE
    );
    this.monitorIconHealthyLarge = this.createMonitorIconVariant(
      "#1B5E20",
      "#A5D6A7",
      MapMarkerIconService.MONITOR_ICON_HOVER_SIZE
    );
    this.monitorIconUnhealthyLarge = this.createMonitorIconVariant(
      "#B71C1C",
      "#EF9A9A",
      MapMarkerIconService.MONITOR_ICON_HOVER_SIZE
    );
    this.redMarkerIcon = this.createRedMarkerIcon();
  }

  private createMonitorIconVariant(
    frameColor: string,
    screenColor: string,
    sizePx: number
  ): L.Icon {
    const svg = `
      <svg width="${sizePx}" height="${sizePx}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 3H4C2.9 3 2 3.9 2 5V17C2 18.1 2.9 19 4 19H8V21H16V19H20C21.1 19 22 18.1 22 17V5C22 3.9 21.1 3 20 3ZM20 17H4V5H20V17Z" fill="${frameColor}"/>
        <path d="M6 7H18V15H6V7Z" fill="${screenColor}"/>
      </svg>
    `;
    const svgBlob = new Blob([svg], { type: "image/svg+xml" });
    const svgUrl = URL.createObjectURL(svgBlob);
    const half = sizePx / 2;
    return L.icon({
      iconUrl: svgUrl,
      iconSize: [sizePx, sizePx],
      iconAnchor: [half, sizePx],
      popupAnchor: [0, -sizePx],
    });
  }

  private createRedMarkerIcon(): L.Icon {
    const svg = `
      <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
        <circle cx="8" cy="8" r="8" fill="#FF0000" stroke="#FFFFFF" stroke-width="1"/>
      </svg>
    `;
    const svgBlob = new Blob([svg], { type: "image/svg+xml" });
    const svgUrl = URL.createObjectURL(svgBlob);
    return L.icon({
      iconUrl: svgUrl,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });
  }
}
