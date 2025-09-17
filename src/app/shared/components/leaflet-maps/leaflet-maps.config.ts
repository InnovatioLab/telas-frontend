import * as L from 'leaflet';

export const MAP_DEFAULT_CENTER: L.LatLngExpression = [-15.7801, -47.9292];
export const MAP_DEFAULT_ZOOM = 12;
export const MAP_PREFER_CANVAS = true;

export const TILE_LAYER_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
export const TILE_LAYER_OPTIONS: L.TileLayerOptions = {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
};

export const CUSTOM_MARKER_ICON = L.icon({
  iconUrl: '/assets/img/marker-custom.png',
  iconSize: [39.286, 58.83],
  iconAnchor: [19.643, 58.83],
  popupAnchor: [0, -58.83]
});