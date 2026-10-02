import { describe, expect, it } from "vitest";
import { LIMITS, nextWindow } from "@/lib/rate-limit-rules";

const rule = LIMITS.loginEmail; // 5 tentativas em 15 minutos
const T0 = Date.parse("2026-10-02T12:00:00Z");

describe("limite de tentativas", () => {
  it("abre uma janela nova na primeira tentativa", () => {
    expect(nextWindow(null, T0, rule)).toMatchObject({ hits: 1, allowed: true });
  });

  it("bloqueia a sexta tentativa dentro da janela e diz quanto esperar", () => {
    let state: { start: number; hits: number } | null = null;
    let last = nextWindow(null, T0, rule);
    for (let i = 0; i < 5; i++) {
      last = nextWindow(state, T0 + i * 1000, rule);
      state = { start: last.start, hits: last.hits };
    }
    expect(last).toMatchObject({ hits: 5, allowed: true });
    const blocked = nextWindow(state, T0 + 60_000, rule);
    expect(blocked.allowed).toBe(false);
    expect(blocked.hits).toBe(5);
    expect(blocked.retryAfterMinutes).toBe(14);
  });

  it("libera de novo quando a janela vence", () => {
    const after = nextWindow({ start: T0, hits: 5 }, T0 + 15 * 60_000, rule);
    expect(after).toMatchObject({ hits: 1, allowed: true, start: T0 + 15 * 60_000 });
  });
});
