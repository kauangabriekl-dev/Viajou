/**
 * Busca de hospedagem: valida o que veio na URL e monta links de comparação de preço.
 * Os links só abrem a busca pública de cada site com destino, datas e hóspedes preenchidos;
 * o Viajou não lê nem copia preços de ninguém. Preço ao vivo dentro do site depende de
 * parceria com API oficial (programas de afiliados), que ainda não existe.
 */

export type StaySearch = {
  where: string;
  checkin: string | null;
  checkout: string | null;
  adults: number;
  rooms: number;
  /** Mensagem quando algo veio inválido e foi corrigido ou ignorado. */
  notice: string | null;
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_NIGHTS = 30;

function isRealDate(value: string) {
  if (!ISO_DATE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

export function nightsBetween(checkin: string, checkout: string) {
  return Math.round(
    (Date.parse(`${checkout}T00:00:00Z`) - Date.parse(`${checkin}T00:00:00Z`)) / 86_400_000,
  );
}

function clampInt(value: unknown, min: number, max: number, fallback: number) {
  const n = typeof value === "string" ? Number.parseInt(value, 10) : NaN;
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
}

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** Lê os parâmetros da página. `today` em AAAA-MM-DD (injetado para testar). */
export function parseStaySearch(
  params: Record<string, string | string[] | undefined>,
  today: string,
): StaySearch {
  const where = (first(params.onde) ?? "").trim().slice(0, 120);
  const adults = clampInt(first(params.adultos), 1, 16, 2);
  const rooms = Math.min(adults, clampInt(first(params.quartos), 1, 8, 1));
  let checkin = first(params.entrada) ?? null;
  let checkout = first(params.saida) ?? null;
  let notice: string | null = null;

  if (checkin && !isRealDate(checkin)) checkin = null;
  if (checkout && !isRealDate(checkout)) checkout = null;
  if (checkin && checkin < today) {
    checkin = null;
    checkout = null;
    notice = "A data de entrada já passou. Escolha novas datas.";
  }
  if (checkin && checkout) {
    const nights = nightsBetween(checkin, checkout);
    if (nights < 1) {
      checkout = null;
      notice = "A saída precisa ser depois da entrada.";
    } else if (nights > MAX_NIGHTS) {
      checkout = null;
      notice = `Busque no máximo ${MAX_NIGHTS} noites por vez.`;
    }
  }
  if (!checkin) checkout = null;

  return { where, checkin, checkout, adults, rooms, notice };
}

export type StayProvider = "booking" | "airbnb" | "expedia" | "google" | "kayak";

export type StayLink = { provider: StayProvider; label: string; url: string };

const enc = encodeURIComponent;

/** Links de busca da região (ou de um hotel, quando `query` é o nome dele + cidade). */
export function stayLinks(
  query: string,
  s: Pick<StaySearch, "checkin" | "checkout" | "adults" | "rooms">,
): StayLink[] {
  const dated = Boolean(s.checkin && s.checkout);
  const booking = new URLSearchParams({
    ss: query,
    group_adults: String(s.adults),
    no_rooms: String(s.rooms),
    lang: "pt-br",
  });
  const airbnb = new URLSearchParams({ adults: String(s.adults) });
  const expedia = new URLSearchParams({
    destination: query,
    adults: String(s.adults),
    rooms: String(s.rooms),
  });
  if (dated) {
    booking.set("checkin", s.checkin!);
    booking.set("checkout", s.checkout!);
    airbnb.set("checkin", s.checkin!);
    airbnb.set("checkout", s.checkout!);
    expedia.set("startDate", s.checkin!);
    expedia.set("endDate", s.checkout!);
  }
  const kayakPath = dated
    ? `/hotels/${enc(query)}/${s.checkin}/${s.checkout}/${s.adults}adults${s.rooms > 1 ? `/${s.rooms}rooms` : ""}`
    : `/hotels/${enc(query)}`;

  return [
    {
      provider: "booking",
      label: "Booking.com",
      url: `https://www.booking.com/searchresults.html?${booking}`,
    },
    {
      provider: "airbnb",
      label: "Airbnb",
      url: `https://www.airbnb.com.br/s/${enc(query)}/homes?${airbnb}`,
    },
    {
      provider: "expedia",
      label: "Expedia",
      url: `https://www.expedia.com.br/Hotel-Search?${expedia}`,
    },
    {
      provider: "google",
      label: "Google Hotéis",
      url: `https://www.google.com/travel/hotels?${new URLSearchParams({ q: `hotéis ${query}`, hl: "pt-BR" })}`,
    },
    { provider: "kayak", label: "Kayak", url: `https://www.kayak.com.br${kayakPath}` },
  ];
}

/** Data AAAA-MM-DD somando dias (para os valores padrão dos campos). */
export function addDays(isoDate: string, days: number) {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
