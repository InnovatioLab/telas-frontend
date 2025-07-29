import { AdRequest } from "./ad-request";
import { Client } from "./client";

export interface RefusedAd {
  id: string;
  justification: string;
  description?: string;
  adRequest: AdRequest;
  validator: Client;
  createdAt?: string;
  updatedAt?: string;
}
