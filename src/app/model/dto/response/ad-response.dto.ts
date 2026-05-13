import { AdValidationType } from "@app/model/client";

export interface AdResponseDto {
  id: string;
  name: string;
  submissionDate: string;
  onAirSince?: string | null;
  link: string;
  downloadLink?: string;
  validation: AdValidationType;
  waitingDays?: number;
  refusedCount: number;
}
