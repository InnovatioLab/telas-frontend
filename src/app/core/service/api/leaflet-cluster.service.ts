import { Injectable } from "@angular/core";
import * as L from "leaflet";
import { MapPoint } from "@app/core/service/state/map-point.interface";

export interface MonitorCluster {
  position: { lat: number; lng: number };
  monitors: MapPoint[];
  count: number;
}

@Injectable({
  providedIn: "root",
})
export class LeafletClusterService {
  private readonly MIN_ZOOM_FOR_CLUSTERING = 14;

  createClusters(points: MapPoint[]): MonitorCluster[] {
    const clusters: MonitorCluster[] = [];
    const locationGroups = new Map<string, MapPoint[]>();

    points.forEach((point) => {
      const locationKey = `${point.latitude.toFixed(6)},${point.longitude.toFixed(6)}`;
      if (!locationGroups.has(locationKey)) {
        locationGroups.set(locationKey, []);
      }
      locationGroups.get(locationKey)!.push(point);
    });

    locationGroups.forEach((groupPoints, locationKey) => {
      const [lat, lng] = locationKey
        .split(",")
        .map((coord) => parseFloat(coord));

      clusters.push({
        position: { lat, lng },
        monitors: groupPoints,
        count: groupPoints.length,
      });
    });

    return clusters;
  }

  shouldCluster(currentZoom: number): boolean {
    return currentZoom <= this.MIN_ZOOM_FOR_CLUSTERING;
  }

  getMinZoomForClustering(): number {
    return this.MIN_ZOOM_FOR_CLUSTERING;
  }

  createClusterIcon(
    count: number,
    monitors: MapPoint[]
  ): L.DivIcon {
    const size = Math.min(50 + count * 4, 80);

    let fillColor = "#FF6B35";
    const availableCount = monitors.filter(
      (m) => m.hasAvailableSlots === true
    ).length;
    const unavailableCount = monitors.filter(
      (m) => m.hasAvailableSlots === false
    ).length;

    if (availableCount === count) {
      fillColor = "#28a745";
    } else if (unavailableCount === count) {
      fillColor = "#6c757d";
    }

    const html = `
      <div style="
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background-color: ${fillColor};
        border: 4px solid #FFFFFF;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #FFFFFF;
        font-weight: bold;
        font-size: ${Math.min(14 + count, 18)}px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        position: relative;
      ">
        <div style="
          position: absolute;
          top: -8px;
          right: -8px;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background-color: #FFFFFF;
          border: 3px solid ${fillColor};
          display: flex;
          align-items: center;
          justify-content: center;
          color: ${fillColor};
          font-weight: bold;
          font-size: 12px;
        ">${count}</div>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
          <path d="M20 3H4C2.9 3 2 3.9 2 5V17C2 18.1 2.9 19 4 19H8V21H16V19H20C21.1 19 22 18.1 22 17V5C22 3.9 21.1 3 20 3ZM20 17H4V5H20V17ZM6 7H18V15H6V7Z"/>
        </svg>
      </div>
    `;

    return L.divIcon({
      html: html,
      className: "custom-cluster-icon",
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  }

  calculateOffsetPosition(
    lat: number,
    lng: number,
    index: number,
    total: number
  ): { lat: number; lng: number } {
    const offset = 0.0002;
    const angle = (index / total) * 2 * Math.PI;

    return {
      lat: lat + offset * Math.cos(angle),
      lng: lng + offset * Math.sin(angle),
    };
  }
}

