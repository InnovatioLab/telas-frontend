import { AdValidationType } from "@app/model/client";

export interface AdResponseDto {
  id: string;
  name: string;
  submissionDate: string;
  link: string;
  validation: AdValidationType;
  waitingDays?: number;
  canBeValidatedByOwner: boolean;
}
