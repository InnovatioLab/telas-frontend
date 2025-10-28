import { Ad, Client } from "./client";

export interface AdRequest {
  id: string;
  message: string;
  attachmentIds?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  ad: Ad;
  client?: Client;
  createdAt?: string;
  updatedAt?: string;
}
