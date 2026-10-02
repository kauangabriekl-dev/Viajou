/** Regras de limite de tentativas: puras, sem banco, testadas em tests/rate-limit.test.ts. */

export type LimitRule = { max: number; windowMs: number };

const MIN = 60_000;

export const LIMITS = {
  /** Tentativas de login por e-mail (erradas; um login certo zera). */
  loginEmail: { max: 5, windowMs: 15 * MIN },
  /** Tentativas de login por IP, somando todos os e-mails. */
  loginIp: { max: 20, windowMs: 15 * MIN },
  /** Contas criadas por IP. */
  signupIp: { max: 5, windowMs: 60 * MIN },
  /** Denúncias por pessoa. */
  report: { max: 20, windowMs: 60 * MIN },
} satisfies Record<string, LimitRule>;

/**
 * Próximo estado do balde depois de mais uma tentativa: janela nova quando a anterior
 * venceu; bloqueio (sem contar mais) quando já chegou ao máximo.
 */
export function nextWindow(
  current: { start: number; hits: number } | null,
  now: number,
  rule: LimitRule,
): { start: number; hits: number; allowed: boolean; retryAfterMinutes: number } {
  if (!current || now - current.start >= rule.windowMs) {
    return { start: now, hits: 1, allowed: true, retryAfterMinutes: 0 };
  }
  if (current.hits >= rule.max) {
    const waitMs = current.start + rule.windowMs - now;
    return { ...current, allowed: false, retryAfterMinutes: Math.max(1, Math.ceil(waitMs / MIN)) };
  }
  return { start: current.start, hits: current.hits + 1, allowed: true, retryAfterMinutes: 0 };
}
