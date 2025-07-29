import { AdValidationType, Role } from '@app/model/client';

export interface AdRequestResponseDto {
  id: string;
  message?: string;
  clientName?: string;
  clientIdentificationNumber?: string;
  clientRole?: Role;
  phone?: string;
  email?: string;
  isActive: boolean;
  submissionDate: string;
  validation: AdValidationType;
  waitingDays: number;
  attachments?: LinkResponseDto[];
  refusedAds?: RefusedAdResponseDto[];
  ad: LinkResponseDto;
}


export interface LinkResponseDto {
  attachmentId: string;
  attachmentLink: string;
}

export interface RefusedAdResponseDto {
  id: string;
  justification: string;
  description?: string;
}