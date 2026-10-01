"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import type { ActionResult } from "@/lib/errors";

type ToggleButtonProps = {
  initialActive: boolean;
  initialCount?: number;
  signedIn: boolean;
  action: () => Promise<ActionResult<{ active: boolean }>>;
  labels: { on: string; off: string };
  icon: (active: boolean) => ReactNode;
  variant?: "ghost" | "solid";
};

/**
 * Base de Curtir/Salvar/Seguir: atualização otimista, reverte se o servidor falhar.
 * Sem login, vira um link para o login que volta para a página atual.
 */
export function ToggleButton({
  initialActive,
  initialCount,
  signedIn,
  action,
  labels,
  icon,
  variant = "ghost",
}: ToggleButtonProps) {
  const pathname = usePathname();
  const [active, setActive] = useState(initialActive);
  const [count, setCount] = useState(initialCount);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const base =
    variant === "solid"
      ? `rounded-full px-5 py-2 text-sm font-bold ${active ? "bg-white text-tinta ring-1 ring-linha" : "bg-petroleo text-white hover:bg-petroleo-900"}`
      : "rounded-full px-3 py-2 text-sm font-semibold text-tinta-soft hover:bg-petroleo-100 hover:text-petroleo";

  const content = (
    <>
      {icon(active)}
      <span className={variant === "ghost" ? "sr-only sm:not-sr-only" : ""}>
        {active ? labels.on : labels.off}
      </span>
      {count !== undefined && <span className="tabular-nums">{count}</span>}
    </>
  );

  if (!signedIn) {
    return (
      <Link
        href={`/login?next=${encodeURIComponent(pathname)}`}
        className={`inline-flex items-center gap-1.5 ${base}`}
      >
        {content}
      </Link>
    );
  }

  return (
    <span className="inline-flex flex-col items-start">
      <button
        type="button"
        aria-pressed={active}
        disabled={pending}
        onClick={() => {
          const next = !active;
          setError(null);
          setActive(next);
          if (count !== undefined) setCount(count + (next ? 1 : -1));
          startTransition(async () => {
            const result = await action();
            if (!result.ok) {
              setActive(!next);
              if (count !== undefined) setCount(count);
              setError(result.error);
            } else if (result.data && result.data.active !== next) {
              setActive(result.data.active);
            }
          });
        }}
        className={`inline-flex items-center gap-1.5 ${base}`}
      >
        {content}
      </button>
      {error && (
        <span role="alert" className="px-3 text-xs text-red-700">
          {error}
        </span>
      )}
    </span>
  );
}
