import { describe, expect, it } from "vitest";
import { addDays, nightsBetween, parseStaySearch, stayLinks } from "@/lib/stays";

const TODAY = "2026-10-01";

describe("parseStaySearch", () => {
  it("aceita uma busca válida", () => {
    const s = parseStaySearch(
      { onde: " Santos ", entrada: "2026-10-17", saida: "2026-10-18", adultos: "2", quartos: "1" },
      TODAY,
    );
    expect(s).toEqual({
      where: "Santos",
      checkin: "2026-10-17",
      checkout: "2026-10-18",
      adults: 2,
      rooms: 1,
      notice: null,
    });
  });

  it("usa padrões e limita hóspedes e quartos", () => {
    expect(parseStaySearch({}, TODAY)).toMatchObject({
      where: "",
      adults: 2,
      rooms: 1,
      checkin: null,
    });
    expect(parseStaySearch({ adultos: "99", quartos: "50" }, TODAY)).toMatchObject({
      adults: 16,
      rooms: 8,
    });
    expect(parseStaySearch({ adultos: "1", quartos: "3" }, TODAY).rooms).toBe(1);
    expect(parseStaySearch({ adultos: "abc" }, TODAY).adults).toBe(2);
  });

  it("descarta datas inválidas, passadas, invertidas ou longas demais", () => {
    expect(
      parseStaySearch({ entrada: "2026-02-30", saida: "2026-03-02" }, TODAY).checkin,
    ).toBeNull();
    const past = parseStaySearch({ entrada: "2026-09-01", saida: "2026-09-03" }, TODAY);
    expect(past.checkin).toBeNull();
    expect(past.notice).toMatch(/já passou/);
    const inverted = parseStaySearch({ entrada: "2026-10-20", saida: "2026-10-18" }, TODAY);
    expect(inverted).toMatchObject({ checkin: "2026-10-20", checkout: null });
    expect(
      parseStaySearch({ entrada: "2026-10-20", saida: "2026-12-20" }, TODAY).checkout,
    ).toBeNull();
    expect(parseStaySearch({ saida: "2026-10-20" }, TODAY).checkout).toBeNull();
  });
});

describe("stayLinks", () => {
  it("leva destino, datas e hóspedes para cada site", () => {
    const links = stayLinks("Santos, Brasil", {
      checkin: "2026-10-17",
      checkout: "2026-10-18",
      adults: 2,
      rooms: 1,
    });
    const byId = Object.fromEntries(links.map((l) => [l.provider, new URL(l.url)]));
    expect(Object.keys(byId)).toEqual(["booking", "airbnb", "expedia", "google", "kayak"]);
    expect(byId.booking.searchParams.get("ss")).toBe("Santos, Brasil");
    expect(byId.booking.searchParams.get("checkin")).toBe("2026-10-17");
    expect(byId.airbnb.searchParams.get("checkout")).toBe("2026-10-18");
    expect(byId.expedia.searchParams.get("startDate")).toBe("2026-10-17");
    expect(byId.kayak.pathname).toBe("/hotels/Santos%2C%20Brasil/2026-10-17/2026-10-18/2adults");
    expect(links.every((l) => l.url.startsWith("https://"))).toBe(true);
  });

  it("funciona sem datas", () => {
    const links = stayLinks("Paris", { checkin: null, checkout: null, adults: 1, rooms: 1 });
    expect(new URL(links[0].url).searchParams.has("checkin")).toBe(false);
    expect(links.find((l) => l.provider === "kayak")?.url).toBe(
      "https://www.kayak.com.br/hotels/Paris",
    );
  });
});

describe("datas", () => {
  it("conta noites e soma dias", () => {
    expect(nightsBetween("2026-10-17", "2026-10-20")).toBe(3);
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });
});
