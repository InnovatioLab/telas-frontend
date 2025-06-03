export interface MapPoint {
  id?: string;
  title?: string;
  description?: string;
  latitude: number;
  longitude: number;
  icon?: any; // Usando any para aceitar tanto string quanto Icon
  data?: any;
  type?: string;
  category?: string;
}
