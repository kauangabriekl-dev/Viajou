"use client";

import { useState } from "react";
import {
  packingTips,
  verdictLabel,
  type MonthClimate,
  type MonthScore,
  type MonthVerdict,
} from "@/lib/climate";
import { monthLong, monthShort } from "@/lib/labels";
import type { DestinationStyle } from "@/types/database";

// Escala de um só tom (verde-água), do mais claro (evite) ao mais forte (ótima).
// O nome do veredito vai sempre escrito: a cor nunca é a única pista.
const tone: Record<MonthVerdict, string> = {
  otima: "bg-agua-700 text-white",
  boa: "bg-agua text-tinta",
  regular: "bg-agua/35 text-tinta",
  evite: "bg-linha text-tinta-soft",
};

/** Os 12 meses com a nota do clima; escolher um mostra o resumo e o que levar. */
export function ClimateMonths({
  months,
  scores,
  styles,
  best,
  initialMonth,
}: {
  months: MonthClimate[];
  scores: MonthScore[];
  styles: DestinationStyle[];
  best: number[];
  initialMonth: number;
}) {
  const [selected, setSelected] = useState(initialMonth);
  const score = scores[selected - 1];
  const climate = months[selected - 1];
  const tips = packingTips(climate, styles);

  return (
    <div className="space-y-3">
      <p className="text-sm">
        <span className="font-semibold">Melhores meses: </span>
        {best.map((m) => monthLong[m - 1]).join(", ")}.
      </p>
      <fieldset>
        <legend className="mb-2 text-xs font-semibold text-tinta-soft">
          Quando você vai? Toque no mês:
        </legend>
        <div className="grid grid-cols-6 gap-1">
          {scores.map((s) => (
            <label
              key={s.month}
              className={`flex min-h-11 cursor-pointer flex-col items-center justify-center rounded-lg px-0.5 text-center leading-tight ring-petroleo has-checked:ring-2 has-focus-visible:ring-2 has-focus-visible:ring-sol ${tone[s.verdict]}`}
            >
              <input
                type="radio"
                name="mes-clima"
                value={s.month}
                checked={selected === s.month}
                onChange={() => setSelected(s.month)}
                className="sr-only"
              />
              <span className="text-[11px] font-bold">{monthShort[s.month - 1]}</span>
              <span className="text-[9px]">{verdictLabel[s.verdict]}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="rounded-xl bg-espuma p-3 text-sm" aria-live="polite">
        <p className="font-semibold">
          {monthLong[selected - 1]}: {verdictLabel[score.verdict].toLowerCase()} época
        </p>
        <p className="text-tinta-soft">
          {score.summary}. Em média {Math.round(climate.rainyDays)} dias de chuva no mês.
        </p>
        {tips.length > 0 && (
          <>
            <p className="mt-2 font-semibold">O que levar</p>
            <ul className="list-disc space-y-0.5 pl-5 text-tinta-soft">
              {tips.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
