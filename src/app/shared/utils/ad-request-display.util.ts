import {
  AdRequestWorkflowStatus,
  PartnerSubmissionMode,
} from "@app/model/dto/response/ad-request-response.dto";

export function partnerSubmissionModeLabel(
  mode?: PartnerSubmissionMode | null
): string {
  switch (mode) {
    case "ADMIN_MATERIALS":
      return "Create Ad";
    case "PARTNER_FINISHED_CREATIVE":
      return "Finished Ad";
    case "READY_CREATIVE":
      return "Ready creative";
    default:
      return "—";
  }
}

export function adRequestWorkflowLabel(
  status?: AdRequestWorkflowStatus
): string {
  switch (status) {
    case "AWAITING_ADMIN_UPLOAD":
      return "Awaiting admin";
    case "AWAITING_PARTNER_REVIEW":
      return "Awaiting your review";
    case "AWAITING_CLIENT_REVIEW":
      return "Awaiting your review";
    case "AWAITING_ADMIN_DIRECT_APPROVAL":
      return "Awaiting admin approval";
    case "REOPENED_AFTER_REJECTION":
      return "Reopened after rejection";
    default:
      return status ?? "—";
  }
}

export function adRequestWorkflowSeverity(
  status?: AdRequestWorkflowStatus
): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" {
  switch (status) {
    case "AWAITING_ADMIN_UPLOAD":
    case "AWAITING_ADMIN_DIRECT_APPROVAL":
      return "info";
    case "AWAITING_PARTNER_REVIEW":
    case "AWAITING_CLIENT_REVIEW":
      return "warn";
    case "REOPENED_AFTER_REJECTION":
      return "danger";
    default:
      return "secondary";
  }
}
