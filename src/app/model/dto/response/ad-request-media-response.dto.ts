import { LinkResponseDto } from "@app/model/dto/response/ad-request-response.dto";

export interface AdRequestMediaResponseDto {
  ad: LinkResponseDto | null;
  attachments: LinkResponseDto[];
}
