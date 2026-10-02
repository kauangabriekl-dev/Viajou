/**
 * Converte erros técnicos (banco e login) em mensagens amigáveis.
 * Detalhes técnicos só vão para o log do servidor, nunca para a interface.
 */
type ErrorLike = { code?: string; message?: string; status?: number } | null | undefined;

const byPgCode: Record<string, string> = {
  "23505": "Você já realizou esta ação.",
  "23503": "O item relacionado não existe mais.",
  // O H2 usa códigos próprios para a mesma situação (verificado na Fase 0).
  "23506": "O item relacionado não existe mais.",
  "23514": "Alguns dados estão fora do permitido. Revise e tente de novo.",
  "23513": "Alguns dados estão fora do permitido. Revise e tente de novo.",
  "42501": "Você não tem permissão para fazer isso.",
  P0002: "Não encontramos o que você procurava.",
  PGRST116: "Não encontramos o que você procurava.",
};

const byAuthCode: Record<string, string> = {
  invalid_credentials: "E-mail ou senha incorretos.",
  email_not_confirmed: "Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.",
  user_already_exists: "Já existe uma conta com este e-mail.",
  email_exists: "Já existe uma conta com este e-mail.",
  weak_password: "Escolha uma senha mais forte.",
  over_request_rate_limit: "Muitas tentativas. Aguarde alguns minutos e tente de novo.",
  over_email_send_rate_limit: "Muitas tentativas. Aguarde alguns minutos e tente de novo.",
};

export const GENERIC_ERROR = "Não foi possível concluir agora. Tente de novo em instantes.";

export function friendlyError(error: ErrorLike, context?: string): string {
  if (!error) return GENERIC_ERROR;
  if (process.env.NODE_ENV !== "production") {
    console.error(`[viajou]${context ? ` ${context}:` : ""}`, error);
  }
  if (error.code && byAuthCode[error.code]) return byAuthCode[error.code];
  if (error.code && byPgCode[error.code]) return byPgCode[error.code];
  if (error.message?.includes("Limite de 10 fotos"))
    return "Cada publicação pode ter até 10 fotos.";
  return GENERIC_ERROR;
}

export type ActionResult<T = undefined> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> };
