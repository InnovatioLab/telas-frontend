import { DefaultStatus } from "@app/model/client";

export interface ClientRequestDTO {
  businessName: string;
  identificationNumber: string;
  industry: string;
  websiteUrl?: string;
  status?: DefaultStatus;
  contact: ContactRequestDTO;
  owner: OwnerRequestDTO;
  addresses: AddressRequestDTO[];
  socialMedia?: Record<string, string>;
}

export interface ContactRequestDTO {
  email: string;
  phone: string;
}

export interface OwnerRequestDTO {
  identificationNumber: string;
  firstName: string;
  lastName?: string;
  email: string;
  phone: string;
}

export interface AddressRequestDTO {
  street: string;
  zipCode: string;
  city: string;
  state: string;
  country: string;
  complement?: string;
  partnerAddress?: boolean;
  latitude?: number;
  longitude?: number;
}