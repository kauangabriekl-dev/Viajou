import { z } from "zod";

/**
 * Variáveis públicas (podem ir ao navegador).
 * Referenciadas literalmente para que o Next.js consiga embuti-las no bundle do cliente.
 * A conexão com o banco H2 usa DB_* e fica só no servidor (lib/db/client.ts).
 */
const publicSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url().default("http://localhost:3000"),
});

const emptyToUndefined = (value: string | undefined) => (value ? value : undefined);

export const publicEnv = publicSchema.parse({
  NEXT_PUBLIC_SITE_URL: emptyToUndefined(process.env.NEXT_PUBLIC_SITE_URL),
});

/**
 * Login com Google dependia do Supabase Auth e ainda não existe no banco local.
 * O botão fica escondido até haver um provedor OAuth configurado.
 */
export const googleAuthEnabled = false;
