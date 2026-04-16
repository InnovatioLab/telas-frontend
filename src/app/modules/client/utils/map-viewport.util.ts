import * as L from "leaflet";

export const MAX_VIEWPORT_AXIS_SPAN_DEG = 0.5;
export const DEFAULT_VIEWPORT_EXPAND_RATIO = 0.25;

function shrinkAxisToMaxSpan(
  min: number,
  max: number,
  maxSpanDeg: number
): { min: number; max: number } {
  const span = max - min;
  if (span <= maxSpanDeg) {
    return { min, max };
  }
  const center = (min + max) / 2;
  const half = maxSpanDeg / 2;
  return { min: center - half, max: center + half };
}

export function normalizeViewportRequestBounds(
  minLat: number,
  maxLat: number,
  minLng: number,
  maxLng: number,
  maxSpanDeg: number
): { minLat: number; maxLat: number; minLng: number; maxLng: number } {
  const lat = shrinkAxisToMaxSpan(minLat, maxLat, maxSpanDeg);
  const lng = shrinkAxisToMaxSpan(minLng, maxLng, maxSpanDeg);
  return {
    minLat: lat.min,
    maxLat: lat.max,
    minLng: lng.min,
    maxLng: lng.max,
  };
}

export function expandLatLngBounds(
  bounds: L.LatLngBounds,
  ratio: number
): L.LatLngBounds {
  const sw = bounds.getSouthWest();
  const ne = bounds.getNorthEast();
  const latSpan = ne.lat - sw.lat;
  const lngSpan = ne.lng - sw.lng;
  const padLat = latSpan * ratio;
  const padLng = lngSpan * ratio;
  return L.latLngBounds(
    L.latLng(sw.lat - padLat, sw.lng - padLng),
    L.latLng(ne.lat + padLat, ne.lng + padLng)
  );
}

export function clampBoundsToMaxAxisSpan(
  bounds: L.LatLngBounds,
  maxSpanDeg: number
): { minLat: number; maxLat: number; minLng: number; maxLng: number } {
  const sw = bounds.getSouthWest();
  const ne = bounds.getNorthEast();
  let minLat = sw.lat;
  let maxLat = ne.lat;
  let minLng = sw.lng;
  let maxLng = ne.lng;
  const latSpan = maxLat - minLat;
  const lngSpan = maxLng - minLng;
  let out: { minLat: number; maxLat: number; minLng: number; maxLng: number };
  if (latSpan <= maxSpanDeg && lngSpan <= maxSpanDeg) {
    out = { minLat, maxLat, minLng, maxLng };
  } else {
    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;
    const half = maxSpanDeg / 2;
    out = {
      minLat: centerLat - half,
      maxLat: centerLat + half,
      minLng: centerLng - half,
      maxLng: centerLng + half,
    };
  }
  return normalizeViewportRequestBounds(
    out.minLat,
    out.maxLat,
    out.minLng,
    out.maxLng,
    maxSpanDeg
  );
}

export function boundsFromPoints(points: { latitude: number; longitude: number }[]): L.LatLngBounds | null {
  if (!points.length) {
    return null;
  }
  const ll = points.map((p) => L.latLng(p.latitude, p.longitude));
  return L.latLngBounds(ll);
}
