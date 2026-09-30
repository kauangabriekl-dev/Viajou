import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig } from "@/lib/env";

/** Cliente Supabase para Client Components. Usa apenas a chave anônima. */
export function createClient() {
  const config = getSupabaseConfig();
  if (!config) {
    throw new Error("Supabase não configurado. Veja .env.example.");
  }
  return createBrowserClient(config.url, config.anonKey);
}
