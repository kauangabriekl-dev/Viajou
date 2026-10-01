import { describe, expect, it } from "vitest";
import { destinationStyleValues } from "@/lib/labels";
import { READY_ITINERARIES, filterReady, getReadyItinerary } from "@/lib/ready-itineraries";

describe("roteiros prontos", () => {
  it("tem slugs únicos e dados válidos", () => {
    const slugs = READY_ITINERARIES.map((r) => r.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const r of READY_ITINERARIES) {
      expect(r.slug).toMatch(/^[a-z0-9-]+$/);
      expect(r.days.length).toBeGreaterThan(0);
      expect(r.days.every((d) => d.stops.length > 0)).toBe(true);
      expect(r.bestMonths.every((m) => m >= 1 && m <= 12)).toBe(true);
      expect(r.styles.every((s) => destinationStyleValues.includes(s))).toBe(true);
    }
  });

  it("filtra por região, duração e estilo", () => {
    expect(filterReady({ region: "brasil" }).every((r) => r.region === "brasil")).toBe(true);
    expect(filterReady({ duration: "curto" }).every((r) => r.days.length <= 3)).toBe(true);
    expect(filterReady({ duration: "longo" }).every((r) => r.days.length >= 6)).toBe(true);
    expect(filterReady({ style: "frio" }).map((r) => r.slug)).toContain("gramado-e-canela-3-dias");
    expect(filterReady({}).length).toBe(READY_ITINERARIES.length);
  });

  it("busca por slug", () => {
    expect(getReadyItinerary("rio-de-janeiro-5-dias")?.days).toHaveLength(5);
    expect(getReadyItinerary("nao-existe")).toBeNull();
  });
});
