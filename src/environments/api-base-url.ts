export function apiBaseUrl(raw: string | undefined): string {
  if (raw == null || String(raw).trim() === '') {
    return '';
  }
  const t = String(raw).trim();
  const withScheme = /^https?:\/\//i.test(t) ? t : `http://${t.replace(/^\/+/, '')}`;
  return withScheme.endsWith('/') ? withScheme : `${withScheme}/`;
}
