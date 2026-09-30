"use client";

import { Flag } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useActionState, useRef } from "react";
import { FormMessage } from "@/components/forms/FormMessage";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { submitReport } from "@/lib/actions/social";
import { reportReasonLabels, reportTargetLabels } from "@/lib/labels";
import type { ReportTarget } from "@/types/database";

type ReportButtonProps = { targetType: ReportTarget; targetId: string; signedIn: boolean };

/** Denúncia em um <dialog> nativo (foco, Esc e acessibilidade vêm do navegador). */
export function ReportButton({ targetType, targetId, signedIn }: ReportButtonProps) {
  const pathname = usePathname();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [state, formAction] = useActionState(submitReport, null);
  const label = `Denunciar ${reportTargetLabels[targetType]}`;
  const className =
    "inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold text-tinta-soft hover:bg-red-50 hover:text-red-700";

  if (!signedIn) {
    return (
      <Link
        href={`/login?next=${encodeURIComponent(pathname)}`}
        className={className}
        aria-label={label}
      >
        <Flag aria-hidden="true" className="h-4 w-4" />
        <span className="sr-only sm:not-sr-only">Denunciar</span>
      </Link>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className={className}
        aria-label={label}
      >
        <Flag aria-hidden="true" className="h-4 w-4" />
        <span className="sr-only sm:not-sr-only">Denunciar</span>
      </button>
      <dialog
        ref={dialogRef}
        className="m-auto w-[min(92vw,28rem)] rounded-2xl p-0 backdrop:bg-tinta/50"
      >
        <form action={formAction} className="space-y-4 p-6">
          <h2 className="text-lg font-extrabold">{label}</h2>
          <input type="hidden" name="targetType" value={targetType} />
          <input type="hidden" name="targetId" value={targetId} />
          <fieldset className="space-y-2">
            <legend className="mb-2 text-sm font-semibold">Motivo</legend>
            {Object.entries(reportReasonLabels).map(([value, text]) => (
              <label key={value} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="reason"
                  value={value}
                  required
                  className="accent-atlantico"
                />
                {text}
              </label>
            ))}
          </fieldset>
          <div className="space-y-1.5">
            <label htmlFor={`report-details-${targetId}`} className="text-sm font-semibold">
              Detalhes <span className="font-normal text-tinta-soft">(opcional)</span>
            </label>
            <textarea
              id={`report-details-${targetId}`}
              name="details"
              maxLength={1000}
              rows={3}
              className="w-full rounded-xl border border-linha p-3 text-sm"
            />
          </div>
          <FormMessage state={state} />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="rounded-full px-4 py-2 text-sm font-semibold"
            >
              {state?.ok ? "Fechar" : "Cancelar"}
            </button>
            {!state?.ok && <SubmitButton pendingLabel="Enviando…">Enviar denúncia</SubmitButton>}
          </div>
        </form>
      </dialog>
    </>
  );
}
