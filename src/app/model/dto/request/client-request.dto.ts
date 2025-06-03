export interface ClientRequestDTO {
  businessName?: string;
  identificationNumber?: string;
  industry?: string;
  websiteUrl?: string;
  contact?: {
    email?: string;
    phone?: string;
  };
  owner: {
    identificationNumber?: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  socialMedia?: {
    instagramUrl?: string;
    facebookUrl?: string;
    linkedinUrl?: string;
    xUrl?: string;
    tiktokUrl?: string;
    [key: string]: string | undefined;
  };
  addresses?: {
    street?: string;
    number?: string;
    complement?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
    latitude?: number | string | null;
    longitude?: number | string | null;
    partnerAddress?: boolean;
  }[];
}