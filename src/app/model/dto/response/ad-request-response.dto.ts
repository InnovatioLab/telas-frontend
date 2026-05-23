import { AdValidationType, Role } from "@app/model/client";

export type AdRequestWorkflowStatus =
  | "AWAITING_ADMIN_UPLOAD"
  | "AWAITING_PARTNER_REVIEW"
  | "AWAITING_CLIENT_REVIEW"
  | "AWAITING_ADMIN_DIRECT_APPROVAL"
  | "REOPENED_AFTER_REJECTION";

export type AdRequestOrigin = "CLIENT" | "PARTNER";

export type PartnerSubmissionMode =
  | "READY_CREATIVE"
  | "ADMIN_MATERIALS"
  | "PARTNER_FINISHED_CREATIVE";

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
  ad?: LinkResponseDto | null;
  requestOrigin?: AdRequestOrigin;
  submissionMode?: PartnerSubmissionMode | null;
  targetMonitorId?: string | null;
  targetMonitorSummary?: string | null;
  workflowStatus?: AdRequestWorkflowStatus;
  adminActionLabel?: string;
  adValidation?: AdValidationType | null;
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
