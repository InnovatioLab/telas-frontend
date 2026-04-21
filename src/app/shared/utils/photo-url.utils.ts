export function resolvePhotoUrl(input: {
  apiUrl: string;
  photoUrl?: string | null;
}): string | null {
  const raw = input.photoUrl;
  if (raw == null || !String(raw).trim()) {
    return null;
  }

  const u = String(raw).trim();
  if (/^https?:\/\//i.test(u)) {
    return u;
  }

  try {
    const origin = new URL(input.apiUrl).origin;
    return u.startsWith("/") ? origin + u : `${origin}/${u}`;
  } catch {
    return u;
  }
}

