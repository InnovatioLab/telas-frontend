import { AuthenticatedClientResponseDto } from "@app/model/dto/response/authenticated-client-response.dto";
import { ClientWorkspaceResponseDto } from "@app/model/dto/response/client-workspace-response.dto";

export function mergeAuthenticatedClientWithWorkspace(
  session: AuthenticatedClientResponseDto,
  workspace: ClientWorkspaceResponseDto
): AuthenticatedClientResponseDto {
  return {
    ...session,
    adRequest: workspace.adRequest,
    attachments: workspace.attachments ?? [],
    ads: workspace.ads ?? [],
    hasAdRequest: workspace.adRequest != null || session.hasAdRequest,
  };
}
