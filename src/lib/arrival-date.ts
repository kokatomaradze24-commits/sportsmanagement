// Formats a request's created_at as "day month, HH:MM" in the UI language.
export function formatArrivalDateTime(iso: string, monthLong: (m: number) => string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getDate()} ${monthLong(d.getMonth() + 1)}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
