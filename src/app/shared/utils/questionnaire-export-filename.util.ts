function sanitizeFileNameSegment(value: string | null | undefined): string {
  if (!value?.trim()) {
    return "";
  }
  return value
    .replace(/"/g, "_")
    .replace(/\r/g, "")
    .replace(/\n/g, "")
    .replace(/\//g, "_")
    .replace(/\\/g, "_")
    .trim();
}

function truncate(value: string): string {
  return value.length > 200 ? value.slice(0, 200) : value;
}

export function buildQuestionnaireExportFileName(
  clientName: string | null | undefined,
  adName: string | null | undefined
): string {
  const client = sanitizeFileNameSegment(clientName);
  const ad = sanitizeFileNameSegment(adName);
  if (!client && !ad) {
    return "questionnaire.txt";
  }
  if (!client) {
    return `${truncate(ad)}.txt`;
  }
  if (!ad) {
    return `${truncate(client)}.txt`;
  }
  return `${truncate(client + ad)}.txt`;
}
