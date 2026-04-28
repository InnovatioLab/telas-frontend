export function buildStreetViewThumbnailUrl(
  lat: number,
  lng: number,
  apiKey: string,
  widthPx = 176,
  heightPx = 132
): string {
  const params = new URLSearchParams({
    size: `${Math.min(widthPx, 640)}x${Math.min(heightPx, 640)}`,
    location: `${lat},${lng}`,
    fov: "75",
    pitch: "8",
    radius: "75",
    key: apiKey,
  });
  return `https://maps.googleapis.com/maps/api/streetview?${params.toString()}`;
}

export function buildStaticMapThumbnailUrl(
  lat: number,
  lng: number,
  apiKey: string,
  widthPx = 176,
  heightPx = 132
): string {
  const w = Math.min(widthPx, 640);
  const h = Math.min(heightPx, 640);
  const markerSeg = encodeURIComponent(`color:0x049dd9|${lat},${lng}`);
  const key = encodeURIComponent(apiKey);
  return (
    `https://maps.googleapis.com/maps/api/staticmap` +
    `?center=${lat},${lng}` +
    `&zoom=18` +
    `&size=${w}x${h}` +
    `&scale=2` +
    `&maptype=satellite` +
    `&markers=${markerSeg}` +
    `&key=${key}`
  );
}
