import { DefaultStatus } from "@app/model/client";

export interface ClientRequestDTO {
  businessName: string;
  industry?: string;
  websiteUrl?: string;
  status?: DefaultStatus;
  contact: ContactRequestDTO;
  addresses: AddressRequestDTO[];
  socialMedia?: Record<string, string>;
}

export interface ContactRequestDTO {
  email: string;
  phone: string;
}

export interface AddressRequestDTO {
  id?: string;
  street: string;
  zipCode: string;
  city: string;
  state: string;
  country: string;
  address2?: string;
  latitude?: number;
  longitude?: number;
}
