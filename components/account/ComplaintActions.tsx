"use client";

import { useState, useTransition } from "react";
import { updateComplaintStatus } from "@/lib/actions/complaints";

export function ComplaintActions({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const run = (status: "resolved" | "closed") =>
    startTransition(async () => {
      const r = await updateComplaintStatus(id, status);
      setMessage(r.ok ? (r.message ?? null) : r.error);
    });
  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-linha pt-3">
      <button
        type="button"
        disabled={pending}
        onClick={() => run("resolved")}
        className="rounded-full bg-restinga px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
      >
        Foi resolvida
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => run("closed")}
        className="rounded-full border border-linha px-4 py-2 text-sm font-bold disabled:opacity-60"
      >
        Encerrar
      </button>
      {message && (
        <span role="status" className="text-xs text-tinta-soft">
          {message}
        </span>
      )}
    </div>
  );
}
