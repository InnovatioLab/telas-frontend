import { AdValidationType } from "@app/model/client";

export interface AdResponseDto {
  id: string;
  submissionDate: string;
  link: string;
  validation: AdValidationType;
  waitingDays: number;
}
