const brlWhole = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});
const brlCents = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
});

/** R$ 3.200 quando o valor é redondo; R$ 3.200,50 quando há centavos. */
export function formatBRL(value: number): string {
  return Number.isInteger(value) ? brlWhole.format(value) : brlCents.format(value);
}

/** Formata coordenadas como 16,45° S · 39,06° O */
export function formatCoordinates(latitude: number, longitude: number): string {
  const fmt = (n: number) => Math.abs(n).toFixed(2).replace(".", ",");
  const lat = `${fmt(latitude)}° ${latitude < 0 ? "S" : "N"}`;
  const lng = `${fmt(longitude)}° ${longitude < 0 ? "O" : "L"}`;
  return `${lat}  ${lng}`;
}

export function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

const dateFmt = new Intl.DateTimeFormat("pt-BR", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

/** Datas "puras" (YYYY-MM-DD) são tratadas em UTC para não voltar um dia. */
export function formatDate(value: string): string {
  return dateFmt.format(new Date(value.length === 10 ? `${value}T00:00:00Z` : value));
}

export function formatDateRange(start: string | null, end: string | null): string | null {
  if (start && end)
    return start === end ? formatDate(start) : `${formatDate(start)} a ${formatDate(end)}`;
  return start ? formatDate(start) : end ? formatDate(end) : null;
}

export function tripDays(start: string | null, end: string | null): number | null {
  if (!start || !end) return null;
  const diff = (Date.parse(end) - Date.parse(start)) / 86_400_000;
  return Number.isFinite(diff) && diff >= 0 ? Math.round(diff) + 1 : null;
}

const relative = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });

export function formatRelativeDate(value: string, now: Date = new Date()): string {
  const seconds = Math.round((new Date(value).getTime() - now.getTime()) / 1000);
  const abs = Math.abs(seconds);
  if (abs < 60) return "agora";
  if (abs < 3600) return relative.format(Math.round(seconds / 60), "minute");
  if (abs < 86_400) return relative.format(Math.round(seconds / 3600), "hour");
  if (abs < 86_400 * 30) return relative.format(Math.round(seconds / 86_400), "day");
  return formatDate(value);
}

export function formatCents(cents: number | null | undefined): string | null {
  return cents === null || cents === undefined ? null : formatBRL(cents / 100);
}
