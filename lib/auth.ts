import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClientIfConfigured, type ServerClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

export type Session = {
  userId: string;
  email: string | undefined;
  profile: Profile;
  supabase: ServerClient;
};

/** Usuário logado + perfil. Memorizado por requisição. */
export const getSession = cache(async (): Promise<Session | null> => {
  const supabase = await createClientIfConfigured();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, full_name, bio, avatar_url, created_at")
    .eq("id", user.id)
    .maybeSingle()
    .overrideTypes<Profile, { merge: false }>();
  if (!profile) return null;

  return { userId: user.id, email: user.email, profile, supabase };
});

/** Para páginas privadas: redireciona para o login e volta depois. */
export async function requireSession(next: string): Promise<Session> {
  const session = await getSession();
  if (!session) redirect(`/login?next=${encodeURIComponent(next)}`);
  return session;
}

export { safeNext } from "@/lib/url";
