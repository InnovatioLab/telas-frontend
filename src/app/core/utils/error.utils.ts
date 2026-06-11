export function extractErrorMessage(error: unknown, fallback = "An error occurred"): string {
  if (!error || typeof error !== "object") return fallback;
  const e = error as Record<string, unknown>;
  const nested = e["error"];
  if (nested && typeof nested === "object") {
    const n = nested as Record<string, unknown>;
    if (typeof n["message"] === "string" && n["message"]) return n["message"];
    const data = n["data"];
    if (data && typeof data === "object") {
      const d = data as Record<string, unknown>;
      if (typeof d["message"] === "string" && d["message"]) return d["message"];
    }
  }
  if (typeof e["message"] === "string" && e["message"]) return e["message"];
  return fallback;
}
