import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { exec, one, type Queryable } from "@/lib/db/client";
import type { Profile } from "@/types/database";

export const SESSION_COOKIE = "viajou_sessao";
const SESSION_DAYS = 30;

export type Session = {
  userId: string;
  email: string;
  profile: Profile;
};

const tokenHash = (token: string) => createHash("sha256").update(token).digest("hex");

/** Usuário logado + perfil, a partir do cookie de sessão. Memorizado por requisição. */
export const getSession = cache(async (): Promise<Session | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || token.length > 128) return null;
  const row = await one<Profile & { user_id: string; email: string }>(
    `SELECT u.id AS user_id, u.email, p.id, p.username, p.full_name, p.bio, p.avatar_url, p.created_at
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       JOIN profiles p ON p.id = u.id
      WHERE s.token_hash = $1 AND s.expires_at > CURRENT_TIMESTAMP`,
    [tokenHash(token)],
  );
  if (!row) return null;
  const { user_id, email, ...profile } = row;
  return { userId: user_id, email, profile };
});

/** Para páginas privadas: redireciona para o login e volta depois. */
export async function requireSession(next: string): Promise<Session> {
  const session = await getSession();
  if (!session) redirect(`/login?next=${encodeURIComponent(next)}`);
  return session;
}

/** Cria a sessão no banco e grava o cookie (só em Server Actions e Route Handlers). */
export async function startSession(userId: string, on?: Queryable) {
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await exec(
    "INSERT INTO sessions (id, user_id, token_hash, expires_at) VALUES ($1, $2, $3, $4)",
    [crypto.randomUUID(), userId, tokenHash(token), expires.toISOString()],
    on,
  );
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  });
}

/** Apaga a sessão atual do banco e o cookie. */
export async function endSession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await exec("DELETE FROM sessions WHERE token_hash = $1", [tokenHash(token)]);
  store.delete(SESSION_COOKIE);
}

export { safeNext } from "@/lib/url";
