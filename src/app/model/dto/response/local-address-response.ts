export interface LocalAddressResponse {
  zipCode: string;
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  latitude?: string | null;
  longitude?: string | null;
}