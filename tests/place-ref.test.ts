import { describe, expect, it } from "vitest";
import { placeRefSchema, slugify } from "@/lib/place-ref";

const uuid = "5f0c1b2e-8a3d-4c6e-9f10-1a2b3c4d5e6f";

describe("referência de lugar do formulário", () => {
  it("lugar existente por id", () => {
    expect(placeRefSchema.parse(`id:${uuid}`)).toEqual({ kind: "existing", id: uuid });
  });

  it("lugar novo com tipo e nome (espaços normalizados)", () => {
    expect(placeRefSchema.parse("new:beach:  Praia   do Espelho ")).toEqual({
      kind: "new",
      type: "beach",
      name: "Praia do Espelho",
    });
  });

  it.each([
    "id:nao-e-uuid",
    "new:cassino:Lugar",
    "new:beach:x",
    `new:beach:${"a".repeat(121)}`,
    "qualquer coisa",
  ])("rejeita %s", (value) => {
    expect(placeRefSchema.safeParse(value).success).toBe(false);
  });

  it("slug sem acento, minúsculo e com hífens", () => {
    expect(slugify("Praia do Espelho (Trancoso)")).toBe("praia-do-espelho-trancoso");
    expect(slugify("  Café São José!!  ")).toBe("cafe-sao-jose");
  });
});
