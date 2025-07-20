export interface Advertisement {
  id: string;
  title: string;
  description: string;
  status: AdvertisementStatus;
  clientId: string;
  clientName?: string;
  createdAt: string;
  updatedAt: string;
  imageUrl?: string;
  link?: string;
  startDate?: string;
  endDate?: string;
  priority?: number;
}

export enum AdvertisementStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
} 