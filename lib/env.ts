import { z } from "zod";

/**
 * Variáveis públicas (podem ir ao navegador).
 * Referenciadas literalmente para que o Next.js consiga embuti-las no bundle do cliente.
 */
const publicSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url().default("http://localhost:3000"),
  NEXT_PUBLIC_SUPABASE_URL: z.url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_SHOW_DEMO_DATA: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
});

const emptyToUndefined = (value: string | undefined) => (value ? value : undefined);

export const publicEnv = publicSchema.parse({
  NEXT_PUBLIC_SITE_URL: emptyToUndefined(process.env.NEXT_PUBLIC_SITE_URL),
  NEXT_PUBLIC_SUPABASE_URL: emptyToUndefined(process.env.NEXT_PUBLIC_SUPABASE_URL),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: emptyToUndefined(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  NEXT_PUBLIC_SHOW_DEMO_DATA: emptyToUndefined(process.env.NEXT_PUBLIC_SHOW_DEMO_DATA),
});

export type SupabaseConfig = { url: string; anonKey: string };

/** Retorna a configuração do Supabase ou null quando ainda não foi configurado. */
export function getSupabaseConfig(): SupabaseConfig | null {
  const url = publicEnv.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

/** Botão "Entrar com Google" só aparece quando o provedor foi habilitado no Supabase. */
export const googleAuthEnabled = process.env.NEXT_PUBLIC_ENABLE_GOOGLE_AUTH === "true";
