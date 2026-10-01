"use client";

import { ThumbsUp } from "lucide-react";
import { ConfirmAction } from "@/components/social/ConfirmAction";
import { ToggleButton } from "@/components/social/ToggleButton";
import { deleteDestinationReview, deleteTip, toggleTipVote } from "@/lib/actions/destinations";

/** "Foi útil" (com contagem) para quem não é o autor; "Excluir" para o autor. */
export function TipActions({
  tipId,
  votes,
  voted,
  isOwner,
  signedIn,
}: {
  tipId: string;
  votes: number;
  voted: boolean;
  isOwner: boolean;
  signedIn: boolean;
}) {
  if (isOwner) {
    return (
      <span className="flex items-center gap-3 text-sm text-tinta-soft">
        <span className="inline-flex items-center gap-1.5">
          <ThumbsUp aria-hidden="true" className="h-4 w-4" />
          {votes} {votes === 1 ? "pessoa achou útil" : "pessoas acharam útil"}
        </span>
        <ConfirmAction
          action={() => deleteTip(tipId)}
          confirmMessage="Excluir esta dica?"
          className="rounded-full px-3 py-1 text-xs font-semibold text-tinta-soft hover:text-red-700"
        >
          Excluir
        </ConfirmAction>
      </span>
    );
  }
  return (
    <ToggleButton
      initialActive={voted}
      initialCount={votes}
      signedIn={signedIn}
      action={() => toggleTipVote(tipId)}
      labels={{ on: "Útil", off: "Foi útil?" }}
      icon={(active) => (
        <ThumbsUp
          aria-hidden="true"
          className={`h-4 w-4 ${active ? "fill-agua text-petroleo" : ""}`}
        />
      )}
    />
  );
}

export function DeleteDestinationReview({ reviewId }: { reviewId: string }) {
  return (
    <ConfirmAction
      action={() => deleteDestinationReview(reviewId)}
      confirmMessage="Excluir sua avaliação deste destino?"
      className="rounded-full px-3 py-1 text-xs font-semibold text-tinta-soft hover:text-red-700"
    >
      Excluir
    </ConfirmAction>
  );
}
