import { Ad } from "./client";

export interface RefusedAd {
  id: string;
  justification: string;
  description?: string;
  ad: Ad;
  createdAt?: string;
  updatedAt?: string;
}
