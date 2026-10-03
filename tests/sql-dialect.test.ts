import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { toPostgres } from "../scripts/sql-dialect.mjs";

describe("toPostgres", () => {
  it("troca o gerador de UUID do H2", () => {
    expect(toPostgres("id UUID DEFAULT RANDOM_UUID() PRIMARY KEY,")).toBe(
      "id UUID DEFAULT gen_random_uuid() PRIMARY KEY,",
    );
  });

  it("converte arrays com default vazio", () => {
    expect(toPostgres("tags VARCHAR(40) ARRAY DEFAULT ARRAY[] NOT NULL,")).toBe(
      "tags VARCHAR(40)[] DEFAULT '{}' NOT NULL,",
    );
  });

  it("remove ON UPDATE CURRENT_TIMESTAMP", () => {
    expect(
      toPostgres(
        "updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL",
      ),
    ).toBe("updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL");
  });

  it("não deixa construções do H2 nas migrations traduzidas", () => {
    const dir = join(process.cwd(), "db", "migrations");
    for (const file of readdirSync(dir).filter((f) => f.endsWith(".sql"))) {
      const sql = toPostgres(readFileSync(join(dir, file), "utf8"));
      expect(sql, file).not.toMatch(/RANDOM_UUID|ARRAY DEFAULT ARRAY\[\]|ON UPDATE/);
    }
  });
});
