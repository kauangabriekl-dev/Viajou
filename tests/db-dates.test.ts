import { describe, expect, it } from "vitest";
import { toIsoTimestamp } from "@/lib/db/dates";

describe("datas vindas do H2", () => {
  it("fuso só com horas e microssegundos (formato real do H2)", () => {
    expect(toIsoTimestamp("2026-10-01 09:32:51.164973-03")).toBe("2026-10-01T12:32:51.164Z");
  });

  it("fuso com minutos, com e sem dois-pontos", () => {
    expect(toIsoTimestamp("2026-10-01 09:32:51+05:30")).toBe("2026-10-01T04:02:51.000Z");
    expect(toIsoTimestamp("2026-10-01 09:32:51+0530")).toBe("2026-10-01T04:02:51.000Z");
  });

  it("sem fuso é tratado como UTC", () => {
    expect(toIsoTimestamp("2026-10-01 09:32:51")).toBe("2026-10-01T09:32:51.000Z");
  });

  it("formato desconhecido falha de forma clara", () => {
    expect(() => toIsoTimestamp("ontem")).toThrow(/formato inesperado/);
  });
});
