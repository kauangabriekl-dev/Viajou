import { describe, expect, it } from "vitest";
import {
  complaintSchema,
  itinerarySchema,
  postSchema,
  reviewSchema,
  signUpSchema,
  tripPlanSchema,
} from "@/lib/validation";

const uuid = "5f0c1b2e-8a3d-4c6e-9f10-1a2b3c4d5e6f";

describe("cadastro", () => {
  const valid = {
    fullName: "Ana Souza",
    username: "ana_souza",
    email: "ANA@exemplo.com ",
    password: "12345678",
  };

  it("aceita dados válidos e normaliza e-mail", () => {
    const r = signUpSchema.parse(valid);
    expect(r.email).toBe("ana@exemplo.com");
  });

  it.each(["ab", "com espaço", "acentuação", "a".repeat(31), "UPPER!"])(
    "rejeita username inválido: %s",
    (username) => {
      expect(signUpSchema.safeParse({ ...valid, username }).success).toBe(false);
    },
  );

  it("normaliza username para minúsculas", () => {
    expect(signUpSchema.parse({ ...valid, username: "Ana_Souza" }).username).toBe("ana_souza");
  });

  it("exige senha de 8+ caracteres", () => {
    const r = signUpSchema.safeParse({ ...valid, password: "1234567" });
    expect(r.success).toBe(false);
  });
});

describe("avaliação", () => {
  it("exige nota entre 1 e 5", () => {
    const base = { placeId: uuid, body: "Lugar muito bom, voltaria." };
    expect(reviewSchema.safeParse({ ...base, rating: "0" }).success).toBe(false);
    expect(reviewSchema.safeParse({ ...base, rating: "6" }).success).toBe(false);
    expect(reviewSchema.parse({ ...base, rating: "5" }).rating).toBe(5);
  });

  it("converte campos opcionais vazios em undefined", () => {
    const r = reviewSchema.parse({
      placeId: uuid,
      rating: "4",
      body: "Texto suficiente.",
      title: "",
      visitedOn: "",
    });
    expect(r.title).toBeUndefined();
    expect(r.visitedOn).toBeUndefined();
  });
});

describe("publicação", () => {
  const base = { body: "Sete dias incríveis na Bahia.", placeIds: [], tags: [] };

  it("converte valor em reais para centavos", () => {
    expect(postSchema.parse({ ...base, spent: "3.200,50" }).spent).toBe(320050);
    expect(postSchema.parse({ ...base, spent: "" }).spent).toBeUndefined();
  });

  it("rejeita volta antes da ida", () => {
    const r = postSchema.safeParse({ ...base, tripStart: "2026-07-10", tripEnd: "2026-07-01" });
    expect(r.success).toBe(false);
  });

  it("nota opcional: vazio vira undefined", () => {
    expect(postSchema.parse({ ...base, rating: "" }).rating).toBeUndefined();
    expect(postSchema.parse({ ...base, rating: "4" }).rating).toBe(4);
  });

  it("rejeita tags desconhecidas", () => {
    expect(postSchema.safeParse({ ...base, tags: ["balada"] }).success).toBe(false);
  });
});

describe("roteiro", () => {
  it("exige pelo menos um dia", () => {
    expect(itinerarySchema.safeParse({ title: "Roteiro", days: [] }).success).toBe(false);
  });

  it("parada precisa de lugar ou nome", () => {
    const r = itinerarySchema.safeParse({
      title: "Roteiro",
      days: [{ stops: [{ placeId: "", customName: "" }] }],
    });
    expect(r.success).toBe(false);
  });

  it("valida horário HH:MM", () => {
    const ok = itinerarySchema.safeParse({
      title: "Roteiro",
      days: [{ stops: [{ customName: "Praia", startTime: "08:30" }] }],
    });
    const bad = itinerarySchema.safeParse({
      title: "Roteiro",
      days: [{ stops: [{ customName: "Praia", startTime: "25:00" }] }],
    });
    expect(ok.success).toBe(true);
    expect(bad.success).toBe(false);
  });
});

describe("reclamação e plano de viagem", () => {
  it("exige descrição com 20+ caracteres", () => {
    const r = complaintSchema.safeParse({
      placeId: uuid,
      category: "billing",
      title: "Cobrança",
      description: "curta",
    });
    expect(r.success).toBe(false);
  });

  it("plano: volta não pode ser antes da ida", () => {
    const r = tripPlanSchema.safeParse({
      destinationId: uuid,
      startDate: "2026-12-10",
      endDate: "2026-12-01",
      travelers: "2",
      preferences: [],
    });
    expect(r.success).toBe(false);
  });
});
