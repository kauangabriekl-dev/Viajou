import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseConfig } from "@/lib/env";

/**
 * Cliente Supabase para Server Components, Server Actions e Route Handlers.
 * Respeita RLS: age em nome do usuário logado (chave anônima + cookie de sessão).
 */
export async function createClient() {
  const config = getSupabaseConfig();
  if (!config) {
    throw new Error("Supabase não configurado. Veja .env.example.");
  }

  const cookieStore = await cookies();

  return createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Chamado a partir de um Server Component: o proxy cuida de renovar a sessão.
        }
      },
    },
  });
}

export type ServerClient = Awaited<ReturnType<typeof createClient>>;

/** Mesmo cliente, mas retorna null quando o Supabase ainda não foi configurado. */
export async function createClientIfConfigured(): Promise<ServerClient | null> {
  return getSupabaseConfig() ? createClient() : null;
}
