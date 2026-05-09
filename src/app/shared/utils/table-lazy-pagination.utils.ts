export interface TableLazyPageEvent {
  first?: number | null;
  rows?: number | null;
  page?: number | null;
}

export function resolveLazyTableRequestPage(
  event: TableLazyPageEvent,
  fallbackRows: number
): { page: number; rows: number } {
  const fallback = fallbackRows > 0 ? fallbackRows : 10;
  const rowsRaw = event.rows;
  const rows =
    typeof rowsRaw === "number" && rowsRaw > 0 ? rowsRaw : fallback;

  const pageZeroBased = event.page;
  if (pageZeroBased != null && Number.isFinite(Number(pageZeroBased))) {
    return { page: Number(pageZeroBased) + 1, rows };
  }

  const first =
    typeof event.first === "number" && event.first >= 0 ? event.first : 0;
  return { page: Math.floor(first / rows) + 1, rows };
}
