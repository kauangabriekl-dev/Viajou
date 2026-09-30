"use client";

import { Share2 } from "lucide-react";
import { useState } from "react";

/** Usa o compartilhamento nativo no celular e copia o link no desktop. */
export function ShareButton({ title, path }: { title: string; path: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = new URL(path, window.location.origin).toString();
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // usuário cancelou: segue para copiar
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt("Copie o link:", url);
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-tinta-soft hover:bg-atlantico-100 hover:text-atlantico"
    >
      <Share2 aria-hidden="true" className="h-5 w-5" />
      <span className="sr-only sm:not-sr-only" aria-live="polite">
        {copied ? "Link copiado" : "Compartilhar"}
      </span>
    </button>
  );
}
