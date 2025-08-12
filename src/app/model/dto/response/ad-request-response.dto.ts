import { AdValidationType, Role } from "@app/model/client";

export interface AdRequestResponseDto {
  id: string;
  clientId: string;
  message: string;
  clientName: string;
  clientIdentificationNumber: string;
  clientRole: Role;
  phone?: string;
  email?: string;
  isActive: boolean;
  submissionDate: string;
  waitingDays: number;
  attachments?: LinkResponseDto[];
  refusedAds?: RefusedAdResponseDto[];
  ad: LinkResponseDto;
}

export interface PendingAdAdminValidationResponseDto {
  id: string;
  clientId: string;
  name: string;
  clientName: string;
  clientIdentificationNumber: string;
  clientRole: Role;
  submissionDate: string;
  validation: AdValidationType;
  waitingDays: number;
  link: string;
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
