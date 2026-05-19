import { AdResponseDto } from "./ad-response.dto";
import { BusinessQuestionnaireAnswersDto } from "@app/model/dto/request/business-questionnaire-answers.dto";

export interface AuthenticatedClientResponseDto {
  id: string;
  businessName: string;
  role: string;
  industry?: string;
  status: string;
  contact: {
    id: string;
    email: string;
    phone: string;
  };
  socialMedia: Record<string, string> | null;
  adRequest: {
    id: string;
    attachmentsIds?: string[];
    active?: boolean;
    isActive?: boolean;
    businessAnswers?: BusinessQuestionnaireAnswersDto | null;
    businessQuestionnaireVersion?: number | null;
    businessQuestionnaireUpdatedAt?: string | null;
  } | null;
  addresses: Array<{
    id: string;
    street: string;
    zipCode: string;
    city: string;
    state: string;
    country: string;
    address2: string | null;
    latitude: string | null;
    longitude: string | null;
    partnerAddress: boolean;
    coordinatesParams: string;
  }>;
  attachments: Array<{
    attachmentId: string;
    attachmentName: string;
    attachmentLink: string;
    attachmentDownloadLink?: string;
  }>;
  ads: AdResponseDto[];
  termAccepted: boolean;
  permissions?: string[];
  partnerSlotsAnyLocationEnabled?: boolean;
  currentSubscriptionFlowStep: number;
  hasSubscription: boolean;
  shouldDisplayAttachments: boolean;
  hasAdRequest: boolean;
}
