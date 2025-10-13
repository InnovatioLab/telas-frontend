export interface ClientResponseDTO {
  id: string;
  businessName: string;
  role?: string;
  industry?: string;
  status: string;
  contact: {
    id: string;
    email: string;
    phone: string;
    contactPreference: string;
  };
  socialMedia: Record<string, string> | null;
  addresses: Array<{
    id: string;
    street: string;
    number: string;
    zipCode: string;
    city: string;
    state: string;
    country: string;
    address2: string | null;
    latitude: string | null;
    longitude: string | null;
    partnerAddress: boolean;
    coordinatesParams: string;
  }>;
  attachments: unknown[];
  ads: unknown[];
  notifications: unknown[];
}
