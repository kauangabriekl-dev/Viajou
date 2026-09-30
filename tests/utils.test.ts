import { describe, expect, it } from "vitest";
import { friendlyError } from "@/lib/errors";
import { checkImage, IMAGE_MAX_BYTES, matchesSignature } from "@/lib/images";
import { safeNext } from "@/lib/url";
import { formatCents, formatDate, formatRelativeDate, tripDays } from "@/utils/format";

describe("friendlyError", () => {
  it("traduz códigos do Postgres", () => {
    expect(friendlyError({ code: "23505" })).toBe("Você já realizou esta ação.");
    expect(friendlyError({ code: "42501" })).toMatch(/permissão/);
  });
  it("traduz erros de autenticação", () => {
    expect(friendlyError({ code: "invalid_credentials" })).toBe("E-mail ou senha incorretos.");
  });
  it("nunca expõe a mensagem técnica", () => {
    const msg = friendlyError({ code: "XX000", message: 'relation "secret_table" does not exist' });
    expect(msg).not.toMatch(/secret_table/);
  });
});

describe("imagens", () => {
  it("aceita JPG, PNG e WebP dentro do limite", () => {
    expect(checkImage({ name: "a.jpeg", type: "image/jpeg", size: 1000 })).toEqual({
      ok: true,
      extension: "jpg",
    });
    expect(checkImage({ name: "a.webp", type: "image/webp", size: 1000 }).ok).toBe(true);
  });
  it("rejeita tipo, extensão divergente e tamanho", () => {
    expect(checkImage({ name: "a.gif", type: "image/gif", size: 10 }).ok).toBe(false);
    expect(checkImage({ name: "a.png", type: "image/jpeg", size: 10 }).ok).toBe(false);
    expect(checkImage({ name: "a.png", type: "image/png", size: IMAGE_MAX_BYTES + 1 }).ok).toBe(
      false,
    );
  });
  it("confere assinatura binária", () => {
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(matchesSignature(png, "image/png")).toBe(true);
    expect(matchesSignature(png, "image/jpeg")).toBe(false);
    const fakeHtml = new TextEncoder().encode("<html><script>");
    expect(matchesSignature(fakeHtml, "image/png")).toBe(false);
  });
});

describe("safeNext", () => {
  it.each([
    ["/minha-conta", "/minha-conta"],
    ["//evil.com", "/"],
    ["https://evil.com", "/"],
    ["/\\evil.com", "/"],
    [null, "/"],
  ])("%s → %s", (input, expected) => {
    expect(safeNext(input)).toBe(expected);
  });
});

describe("formatação", () => {
  it("datas YYYY-MM-DD não voltam um dia por fuso", () => {
    expect(formatDate("2026-07-01")).toMatch(/^1 de jul/);
  });
  it("conta dias de viagem inclusive", () => {
    expect(tripDays("2026-07-01", "2026-07-07")).toBe(7);
    expect(tripDays(null, "2026-07-07")).toBeNull();
  });
  it("formata centavos em reais", () => {
    expect(formatCents(320050)?.replace(/\s/g, " ")).toBe("R$ 3.200,50");
    expect(formatCents(320000)?.replace(/\s/g, " ")).toBe("R$ 3.200");
  });
  it("data relativa", () => {
    const now = new Date("2026-09-29T12:00:00Z");
    expect(formatRelativeDate("2026-09-29T11:59:30Z", now)).toBe("agora");
    expect(formatRelativeDate("2026-09-28T12:00:00Z", now)).toBe("ontem");
  });
});
