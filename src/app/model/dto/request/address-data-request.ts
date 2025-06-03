export interface AddressData {
  zipCode: string;
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  latitude?: string | null;
  longitude?: string | null;
  results?: Record<string, Array<{
    postal_code: string;
    country_code: string;
    latitude?: string;
    longitude?: string;
    city: string;
    state: string;
  }>>;
}