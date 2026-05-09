import { AdValidationType, Role } from "@app/model/client";

export interface AdRequestResponseDto {
  id: string;
  clientId: string;
  message: string;
  clientName: string;
  slogan?: string;
  brandGuidelineUrl?: string;
  clientRole: Role;
  isActive: boolean;
  submissionDate: string;
  waitingDays: number;
  attachments?: LinkResponseDto[];
  refusedAds?: RefusedAdResponseDto[];
  ad: LinkResponseDto;
}

export interface ClientReferenceAttachmentAdminDto {
  attachmentId: string;
  slogan: string;
  brandGuidelineUrl: string;
  previewLink: string;
  downloadLink: string;
}

export interface PendingAdAdminValidationResponseDto {
  id: string;
  clientId: string;
  name: string;
  clientName: string;
  clientRole: Role;
  submissionDate: string;
  validation: AdValidationType;
  waitingDays: number;
  link: string;
  clientReferences?: ClientReferenceAttachmentAdminDto[];
}

export interface LinkResponseDto {
  attachmentId: string;
  attachmentName: string;
  attachmentLink: string;
  attachmentDownloadLink?: string;
}

export interface RefusedAdResponseDto {
  id: string;
  justification: string;
  description?: string;
}
