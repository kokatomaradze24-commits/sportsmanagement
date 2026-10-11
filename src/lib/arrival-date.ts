// Formats a request's created_at as "day month" in the UI language.
export function formatArrivalDateTime(iso: string, monthLong: (m: number) => string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getDate()} ${monthLong(d.getMonth() + 1)}`;
}
