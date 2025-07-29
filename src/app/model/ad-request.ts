import { Ad, Client } from "./client";
import { RefusedAd } from "./refused-ad";

export interface AdRequest {
  id: string;
  message: string;
  attachmentIds?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  refusalCount?: number;
  ad?: Ad;
  refusedAds?: RefusedAd[];
  client?: Client;
  createdAt?: string;
  updatedAt?: string;
}
