declare namespace google {
  namespace maps {
    class Map {
      constructor(element: HTMLElement, options?: MapOptions);
      setCenter(latlng: LatLngLiteral): void;
      setZoom(zoom: number): void;
      getZoom(): number;
      fitBounds(bounds: LatLngBounds): void;
      addListener(eventName: string, handler: Function): void;
    }

    interface MapOptions {
      center?: LatLngLiteral;
      zoom?: number;
      mapTypeControl?: boolean;
      streetViewControl?: boolean;
      fullscreenControl?: boolean;
    }

    class Geocoder {
      geocode(
        request: GeocoderRequest,
        callback: (
          results: GeocoderResult[] | null,
          status: GeocoderStatusValue
        ) => void
      ): void;
    }

    interface GeocoderRequest {
      address?: string;
      location?: LatLngLiteral;
      placeId?: string;
    }

    interface GeocoderResult {
      address_components: GeocoderAddressComponent[];
      formatted_address: string;
      geometry: GeocoderGeometry;
      place_id: string;
      types: string[];
    }

    interface GeocoderAddressComponent {
      long_name: string;
      short_name: string;
      types: string[];
    }

    interface GeocoderGeometry {
      location: LatLng;
      location_type: GeocoderLocationType;
      viewport: LatLngBounds;
      bounds?: LatLngBounds;
    }

    interface LatLng {
      lat(): number;
      lng(): number;
    }

    interface LatLngLiteral {
      lat: number;
      lng: number;
    }

    interface LatLngBounds {
      getNorthEast(): LatLng;
      getSouthWest(): LatLng;
    }

    class GeocoderStatus {
      static readonly OK: "OK";
      static readonly ERROR: "ERROR";
      static readonly INVALID_REQUEST: "INVALID_REQUEST";
      static readonly OVER_QUERY_LIMIT: "OVER_QUERY_LIMIT";
      static readonly REQUEST_DENIED: "REQUEST_DENIED";
      static readonly UNKNOWN_ERROR: "UNKNOWN_ERROR";
      static readonly ZERO_RESULTS: "ZERO_RESULTS";
    }

    type GeocoderStatusValue =
      | "OK"
      | "ERROR"
      | "INVALID_REQUEST"
      | "OVER_QUERY_LIMIT"
      | "REQUEST_DENIED"
      | "UNKNOWN_ERROR"
      | "ZERO_RESULTS";

    type GeocoderLocationType =
      | "APPROXIMATE"
      | "GEOMETRIC_CENTER"
      | "RANGE_INTERPOLATED"
      | "ROOFTOP";

    namespace places {
      interface PlacePhoto {
        getUrl(opts?: { maxWidth?: number; maxHeight?: number }): string;
        height: number;
        width: number;
      }
    }
  }
}

