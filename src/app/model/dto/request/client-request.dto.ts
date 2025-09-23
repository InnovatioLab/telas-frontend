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
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

export interface AddressRequestDTO {
  id?: string;
  street: string;
  zipCode: string;
  city: string;
  state: string;
  country: string;
  complement?: string;
  latitude?: number;
  longitude?: number;
}