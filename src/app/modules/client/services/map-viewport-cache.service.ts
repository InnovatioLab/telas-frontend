import { Injectable } from "@angular/core";
import * as L from "leaflet";
import { MapPoint } from "@app/core/service/state/map-point.interface";
import {
  MAX_VIEWPORT_AXIS_SPAN_DEG,
  DEFAULT_VIEWPORT_EXPAND_RATIO,
  boundsFromPoints,
  clampBoundsToMaxAxisSpan,
  expandLatLngBounds,
} from "../utils/map-viewport.util";

@Injectable({ providedIn: "root" })
export class MapViewportCacheService {
  private cachedDataBounds: L.LatLngBounds | null = null;
  private readonly pointsById = new Map<string, MapPoint>();

  reset(): void {
    this.cachedDataBounds = null;
    this.pointsById.clear();
  }

  invalidateViewportFetchCache(): void {
    this.cachedDataBounds = null;
  }

  mergePoints(points: MapPoint[]): void {
    for (const p of points) {
      const key = p.id ?? `${p.latitude},${p.longitude}`;
      this.pointsById.set(key, p);
    }
  }

  setCachedBoundsFromRequest(
    minLat: number,
    maxLat: number,
    minLng: number,
    maxLng: number
  ): void {
    this.cachedDataBounds = L.latLngBounds(
      L.latLng(minLat, minLng),
      L.latLng(maxLat, maxLng)
    );
  }

  isViewportCovered(visible: L.LatLngBounds): boolean {
    if (!this.cachedDataBounds) {
      return false;
    }
    return this.cachedDataBounds.contains(visible);
  }

  filterPointsInBounds(bounds: L.LatLngBounds): MapPoint[] {
    return [...this.pointsById.values()].filter((p) =>
      bounds.contains(L.latLng(p.latitude, p.longitude))
    );
  }

  buildRequestBounds(visible: L.LatLngBounds): {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  } {
    const expanded = expandLatLngBounds(visible, DEFAULT_VIEWPORT_EXPAND_RATIO);
    return clampBoundsToMaxAxisSpan(expanded, MAX_VIEWPORT_AXIS_SPAN_DEG);
  }

  updateCacheFromZipSearchMonitors(points: MapPoint[]): void {
    this.pointsById.clear();
    this.mergePoints(points);
    const b = boundsFromPoints(points);
    if (!b) {
      this.cachedDataBounds = null;
      return;
    }
    const req = clampBoundsToMaxAxisSpan(b, MAX_VIEWPORT_AXIS_SPAN_DEG);
    this.setCachedBoundsFromRequest(req.minLat, req.maxLat, req.minLng, req.maxLng);
  }
}
