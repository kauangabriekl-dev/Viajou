/**
 * Converte o texto de data/hora que o H2 envia pelo protocolo PostgreSQL em ISO 8601.
 * O H2 manda o fuso só com horas ("2026-10-01 09:32:51.164973-03") e microssegundos;
 * o Date do JavaScript precisa de "-03:00" e no máximo milissegundos.
 * Sem fuso (TIMESTAMP sem zona), assume UTC.
 */
export function toIsoTimestamp(value: string): string {
  const m = value
    .trim()
    .match(
      /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}(?::\d{2})?)(?:\.(\d+))?\s*(Z|[+-]\d{2}(?::?\d{2})?)?$/,
    );
  if (!m) throw new RangeError(`Data em formato inesperado: ${value}`);
  const [, date, time, fraction = "", zone] = m;
  const millis = (fraction + "000").slice(0, 3);
  const offset =
    !zone || zone === "Z"
      ? "Z"
      : zone.length === 3
        ? `${zone}:00`
        : zone.includes(":")
          ? zone
          : `${zone.slice(0, 3)}:${zone.slice(3)}`;
  const seconds = time.length === 5 ? `${time}:00` : time;
  return new Date(`${date}T${seconds}.${millis}${offset}`).toISOString();
}
