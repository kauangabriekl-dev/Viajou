// Tradução do dialeto H2 dos arquivos de db/ para PostgreSQL (usada por db.mjs com DATABASE_URL).
// Cobre só o que o projeto usa; testada em tests/sql-dialect.test.ts. Veja docs/deploy.md.
//
//   UUID DEFAULT RANDOM_UUID()                    → gen_random_uuid() (Postgres 13+)
//   VARCHAR(n) ARRAY DEFAULT ARRAY[]               → VARCHAR(n)[] DEFAULT '{}'
//   ... DEFAULT CURRENT_TIMESTAMP ON UPDATE ...    → sem ON UPDATE (o app não lê updated_at)
//   REGEXP_LIKE, ON CONFLICT DO NOTHING, IDENTITY  → iguais (regexp_like: Postgres 15+)

/** @param {string} sql */
export function toPostgres(sql) {
  return sql
    .replace(/RANDOM_UUID\(\)/g, "gen_random_uuid()")
    .replace(/(VARCHAR\(\d+\)) ARRAY DEFAULT ARRAY\[\]/g, "$1[] DEFAULT '{}'")
    .replace(/ ON UPDATE CURRENT_TIMESTAMP/g, "");
}
