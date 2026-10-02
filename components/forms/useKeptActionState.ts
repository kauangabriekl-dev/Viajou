"use client";

import { useActionState, useCallback, useRef, type FormEvent } from "react";
import type { ActionResult } from "@/lib/errors";

/**
 * useActionState que não apaga o formulário quando dá erro.
 *
 * Depois de cada envio o React limpa o formulário chamando `form.reset()`, que dispara
 * um evento "reset" cancelável. Guardamos se a última resposta foi erro e, nesse caso,
 * cancelamos a limpeza: tudo o que a pessoa preencheu fica (texto, estrelas, lugares,
 * fotos escolhidas). Só a senha é apagada, por segurança. Com sucesso, limpa normalmente.
 *
 * Uso: const { state, formAction, onReset } = useKeptActionState(acao);
 *      <form action={formAction} onReset={onReset}>
 */
export function useKeptActionState<T extends ActionResult>(
  action: (prev: T | null, formData: FormData) => Promise<T>,
) {
  const lastFailed = useRef(false);
  const [state, formAction] = useActionState(async (prev: T | null, formData: FormData) => {
    const result = await action(prev, formData);
    lastFailed.current = !result.ok;
    return result;
  }, null);

  const onReset = useCallback((event: FormEvent<HTMLFormElement>) => {
    if (!lastFailed.current) return;
    event.preventDefault();
    for (const input of event.currentTarget.querySelectorAll<HTMLInputElement>(
      'input[type="password"]',
    ))
      input.value = "";
  }, []);

  return { state, formAction, onReset };
}
