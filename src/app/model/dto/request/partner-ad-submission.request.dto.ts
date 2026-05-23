import { AttachmentRequestDto } from "./attachment-request.dto";
import { PartnerSubmissionMode } from "../response/ad-request-response.dto";

export interface PartnerAdSubmissionRequestDto {
  submissionMode: PartnerSubmissionMode;
  attachment?: AttachmentRequestDto;
  attachmentIds?: string[];
  optionalLabel?: string;
}
