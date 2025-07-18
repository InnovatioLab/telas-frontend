export interface ClientResponseDTO {
  id: string;
  businessName: string;
  identificationNumber: string;
  role: string;
  industry: string;
  status: string;
  contact: {
    id: string;
    email: string;
    phone: string;
    contactPreference: string;
  };
  owner: {
    id: string;
    identificationNumber: string;
    firstName: string;
    lastName: string | null;
    email: string;
    phone: string | null;
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
    complement: string | null;
    latitude: string | null;
    longitude: string | null;
    partnerAddress: boolean;
    coordinatesParams: string;
  }>;
  attachments: unknown[];
  ads: unknown[];
  notifications: unknown[];
}
