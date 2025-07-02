export interface MapPoint {
  id?: string;
  title?: string;
  description?: string;
  latitude: number;
  longitude: number;
  position?: { lat: number; lng: number };
  icon?: any;
  data?: any;
  type?: string;
  category?: string;
  hasAvailableSlots?: boolean;
}
