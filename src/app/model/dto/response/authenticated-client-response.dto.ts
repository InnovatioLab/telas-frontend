import { AdValidationType } from "@app/model/client";
import { AdResponseDto } from "./ad-response.dto";

export interface AuthenticatedClientResponseDto {
  id: string;
  businessName: string;
  identificationNumber: string;
  role: string;
  industry: string;
  status: string;
  contact: {
    id: string;
    email: string;
    phone: string;
  };
  owner: {
    id: string;
    identificationNumber: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  socialMedia: Record<string, string> | null;
  adRequest: {
    id: string;
    message: string;
    phone?: string;
    emai?: string;
    attachmentsIds?: string[];
    active: boolean;
  } | null;
  addresses: Array<{
    id: string;
    street: string;
    zipCode: string;
    city: string;
    state: string;
    country: string;
    complement: string | null;
    latitude: string | null;
    longitude: string | null;
    partnerAddress: boolean;
    coordinatesParams: string;
  }>;
  attachments: Array<{
    attachmentId: string;
    attachmentName: string;
    attachmentLink: string;
  }>;
  ads: AdResponseDto[];
  termAccepted: boolean;
  currentSubscriptionFlowStep: number;
  hasSubscription: boolean;
  shouldDisplayAttachments: boolean;
}
