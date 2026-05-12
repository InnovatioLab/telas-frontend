import { AdValidationType, Role } from "@app/model/client";
import { BusinessQuestionnaireAnswersDto } from "@app/model/dto/request/business-questionnaire-answers.dto";

export interface AdRequestResponseDto {
  id: string;
  clientId: string;
  clientName: string;
  clientRole: Role;
  isActive: boolean;
  submissionDate: string;
  waitingDays: number;
  businessQuestionnaireVersion?: number | null;
  businessQuestionnaireUpdatedAt?: string | null;
  attachments?: LinkResponseDto[];
  refusedAds?: RefusedAdResponseDto[];
  ad: LinkResponseDto;
}

export interface ClientReferenceAttachmentAdminDto {
  attachmentId: string;
  businessQuestionnaireVersion?: number | null;
  businessQuestionnaireUpdatedAt?: string | null;
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
