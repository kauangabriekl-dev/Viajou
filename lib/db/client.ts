import "server-only";
import pg from "pg";
import { toIsoTimestamp } from "@/lib/db/dates";

/**
 * Conexão com o banco H2 local (modo PostgreSQL) pelo driver `pg`.
 * Suba o banco com `npm run db:start`. Configuração em DB_* (.env.local), com padrões locais.
 *
 * Regras do H2 descobertas na Fase 0 (ver README):
 *  - parâmetros dentro de ARRAY[...] quebram o servidor: use `sqlArray()` só com valores validados;
 *  - listas em filtros: use `inList()` (um parâmetro por item);
 *  - não há RETURNING: gere ids no Node com crypto.randomUUID().
 */

// Tipos que chegam como texto ou Date viram o formato que o app já usa.
pg.types.setTypeParser(1082, (v) => v); // DATE → "AAAA-MM-DD" (sem voltar um dia por fuso)
pg.types.setTypeParser(1083, (v) => v); // TIME → "HH:MM:SS"
pg.types.setTypeParser(1114, toIsoTimestamp); // TIMESTAMP → ISO (UTC)
pg.types.setTypeParser(1184, toIsoTimestamp); // TIMESTAMPTZ → ISO; o H2 manda "-03" sem minutos
pg.types.setTypeParser(20, (v) => Number(v)); // BIGINT (COUNT) → número
pg.types.setTypeParser(1700, (v) => Number(v)); // NUMERIC (médias, coordenadas) → número

export type Queryable = { query: pg.Pool["query"] | pg.PoolClient["query"] };

function createPool() {
  // Em produção, um Postgres gerenciado costuma vir como DATABASE_URL (com SSL).
  // Sem ela, usa o H2 local pelos DB_* (padrões de desenvolvimento).
  const connection = process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DB_SSL === "false" ? false : { rejectUnauthorized: false },
      }
    : {
        host: process.env.DB_HOST || "127.0.0.1",
        port: Number(process.env.DB_PORT || 5435),
        database: process.env.DB_NAME || "viajou",
        user: process.env.DB_USER || "viajou",
        password: process.env.DB_PASSWORD || "viajou",
      };
  return new pg.Pool({ ...connection, max: 5, idleTimeoutMillis: 30_000 });
}

// Em desenvolvimento o módulo é recarregado a cada mudança: reaproveita o pool.
const globalForDb = globalThis as unknown as { viajouPool?: pg.Pool };
export const pool = globalForDb.viajouPool ?? createPool();
if (process.env.NODE_ENV !== "production") globalForDb.viajouPool = pool;

/** Linhas de uma consulta. */
export async function rows<T>(
  sql: string,
  params: unknown[] = [],
  on: Queryable = pool,
): Promise<T[]> {
  const result = await on.query(sql, params);
  return result.rows as T[];
}

/** Primeira linha ou null. */
export async function one<T>(
  sql: string,
  params: unknown[] = [],
  on: Queryable = pool,
): Promise<T | null> {
  return (await rows<T>(sql, params, on))[0] ?? null;
}

/** Executa e devolve quantas linhas foram afetadas. */
export async function exec(
  sql: string,
  params: unknown[] = [],
  on: Queryable = pool,
): Promise<number> {
  const result = await on.query(sql, params);
  return result.rowCount ?? 0;
}

/** Transação: confirma se `fn` terminar, desfaz se lançar erro. */
export async function tx<T>(fn: (client: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

/**
 * `IN ($3, $4, ...)` com um parâmetro por item. Devolve o trecho SQL e os valores,
 * começando a numeração em `start`. Lista vazia vira `IN (NULL)` (nenhuma linha).
 */
export function inList(values: readonly unknown[], start: number) {
  if (!values.length) return { sql: "IN (NULL)", params: [] as unknown[] };
  return {
    sql: `IN (${values.map((_, i) => `$${start + i}`).join(", ")})`,
    params: [...values],
  };
}

/**
 * Literal `ARRAY['a', 'b']` para gravar arrays no H2 (parâmetros dentro de ARRAY quebram o servidor).
 * Só aceite valores já validados por enum (tags, preferências): aspas são escapadas mesmo assim.
 */
export function sqlArray(values: readonly string[]): string {
  // No Postgres, ARRAY[] vazio não tem tipo e dá erro; '{}' vira o array da coluna.
  if (!values.length && process.env.DATABASE_URL) return "'{}'";
  return `ARRAY[${values.map((v) => `'${String(v).replace(/'/g, "''")}'`).join(", ")}]`;
}

/** Nome sem acento, em minúsculas, para as colunas search_key. */
export function searchKey(...parts: (string | null | undefined)[]): string {
  return parts
    .filter(Boolean)
    .join(" ")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
