"use client";

import { Bookmark } from "lucide-react";
import { ConfirmAction } from "@/components/social/ConfirmAction";
import { ToggleButton } from "@/components/social/ToggleButton";
import { deleteAchado, toggleAchadoSave } from "@/lib/actions/achados";

export function AchadoSaveButton({
  achadoId,
  saved,
  count,
  signedIn,
}: {
  achadoId: string;
  saved: boolean;
  count: number;
  signedIn: boolean;
}) {
  return (
    <ToggleButton
      variant="solid"
      initialActive={saved}
      initialCount={count}
      signedIn={signedIn}
      action={() => toggleAchadoSave(achadoId)}
      labels={{ on: "Salvo para ir", off: "Salvar para ir" }}
      icon={(active) => (
        <Bookmark aria-hidden="true" className={`h-4 w-4 ${active ? "fill-current" : ""}`} />
      )}
    />
  );
}

export function DeleteAchado({ achadoId }: { achadoId: string }) {
  return (
    <ConfirmAction
      action={() => deleteAchado(achadoId)}
      confirmMessage="Excluir este achadinho? As fotos também serão apagadas."
      className="rounded-full px-4 py-2 text-sm font-semibold text-tinta-soft hover:text-red-700"
    >
      Excluir achadinho
    </ConfirmAction>
  );
}
