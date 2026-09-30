"use client";

import { useState, useTransition, type ReactNode } from "react";
import type { ActionResult } from "@/lib/errors";

type ConfirmActionProps = {
  action: () => Promise<ActionResult | void>;
  confirmMessage: string;
  children: ReactNode;
  className?: string;
  pendingLabel?: string;
};

/** Botão para ações destrutivas: pede confirmação e mostra erro amigável. */
export function ConfirmAction({
  action,
  confirmMessage,
  children,
  className = "",
  pendingLabel = "Aguarde…",
}: ConfirmActionProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <span className="inline-flex flex-col">
      <button
        type="button"
        disabled={pending}
        className={className}
        onClick={() => {
          if (!window.confirm(confirmMessage)) return;
          setError(null);
          startTransition(async () => {
            const result = await action();
            if (result && !result.ok) setError(result.error);
          });
        }}
      >
        {pending ? pendingLabel : children}
      </button>
      {error && (
        <span role="alert" className="text-xs text-red-700">
          {error}
        </span>
      )}
    </span>
  );
}
