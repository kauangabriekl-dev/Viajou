import "server-only";
import { headers } from "next/headers";
import { exec, one } from "@/lib/db/client";
import { toIsoTimestamp } from "@/lib/db/dates";
import { nextWindow, type LimitRule } from "@/lib/rate-limit-rules";

export { LIMITS } from "@/lib/rate-limit-rules";

/** IP de quem fez a requisição (atrás de proxy, o primeiro de x-forwarded-for). */
export async function clientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || h.get("x-real-ip") || "local";
}

/**
 * Conta mais uma tentativa no balde e diz se ainda está dentro do limite.
 * Guardado no banco (tabela rate_limits) para valer entre reinícios do servidor.
 */
export async function hitLimit(
  bucket: string,
  rule: LimitRule,
): Promise<{ allowed: boolean; retryAfterMinutes: number }> {
  const key = bucket.slice(0, 200);
  const now = Date.now();
  const row = await one<{ window_start: string; hits: number }>(
    "SELECT window_start, hits FROM rate_limits WHERE bucket = $1",
    [key],
  );
  const current = row
    ? { start: Date.parse(toIsoTimestamp(row.window_start)), hits: Number(row.hits) }
    : null;
  const next = nextWindow(current, now, rule);

  if (!row) {
    await exec(
      "INSERT INTO rate_limits (bucket, window_start, hits) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING",
      [key, new Date(next.start).toISOString(), next.hits],
    );
  } else if (next.allowed) {
    await exec("UPDATE rate_limits SET window_start = $2, hits = $3 WHERE bucket = $1", [
      key,
      new Date(next.start).toISOString(),
      next.hits,
    ]);
  }
  // Limpeza ocasional de janelas vencidas há mais de um dia.
  if (Math.random() < 0.02) {
    await exec("DELETE FROM rate_limits WHERE window_start < $1", [
      new Date(now - 86_400_000).toISOString(),
    ]);
  }
  return { allowed: next.allowed, retryAfterMinutes: next.retryAfterMinutes };
}

/** Zera um balde (ex.: login certo apaga as tentativas erradas daquele e-mail). */
export async function clearLimit(bucket: string) {
  await exec("DELETE FROM rate_limits WHERE bucket = $1", [bucket.slice(0, 200)]);
}
