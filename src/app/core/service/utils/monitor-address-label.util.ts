export interface MonitorAddressFields {
  addressLocationName?: string | null;
  addressLocationDescription?: string | null;
  locationDescription?: string | null;
}

export function getMonitorAddressLines(
  fields: MonitorAddressFields
): { line1: string; line2?: string } {
  const name = fields.addressLocationName?.trim();
  const desc =
    fields.addressLocationDescription?.trim() ||
    fields.locationDescription?.trim();
  if (name && desc) {
    return { line1: name, line2: desc };
  }
  if (name) {
    return { line1: name };
  }
  if (desc) {
    return { line1: desc };
  }
  return { line1: "Endereço indisponível" };
}

export function buildMonitorAddressLabel(fields: MonitorAddressFields): string {
  const { line1, line2 } = getMonitorAddressLines(fields);
  return line2 ? `${line1} · ${line2}` : line1;
}
