import { AdResponseDto } from "./ad-response.dto";
import { AuthenticatedClientResponseDto } from "./authenticated-client-response.dto";

export type ClientWorkspaceAdRequestDto = NonNullable<
  AuthenticatedClientResponseDto["adRequest"]
>;

export interface ClientWorkspaceResponseDto {
  adRequest: ClientWorkspaceAdRequestDto | null;
  attachments: AuthenticatedClientResponseDto["attachments"];
  ads: AdResponseDto[];
}
