export interface IncidentApiDto {
  id: string;
  incidentType: string;
  severity: string;
  boxId?: string | null;
  monitorId?: string | null;
  openedAt: string;
  closedAt?: string | null;
  acknowledgedAt?: string | null;
  acknowledgeReason?: string | null;
  acknowledgedById?: string | null;
  acknowledgedByEmail?: string | null;
  detailsJson?: Record<string, unknown> | null;
}
