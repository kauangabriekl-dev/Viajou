"use client";

import { useKeptActionState } from "@/components/forms/useKeptActionState";
import Link from "next/link";
import { Field, describedBy, inputClass } from "@/components/forms/Field";
import { FormMessage, errorsFor } from "@/components/forms/FormMessage";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { createTripPlan } from "@/lib/actions/trips";
import { travelTags } from "@/lib/labels";
import type { Destination } from "@/types/database";

type Props = {
  destinations: Pick<Destination, "id" | "name" | "state">[];
  initialDestinationId?: string;
  signedIn: boolean;
};

export function TripPlanForm({ destinations, initialDestinationId = "", signedIn }: Props) {
  const { state: state, formAction: action, onReset } = useKeptActionState(createTripPlan);
  const e = (f: string) => errorsFor(state, f);
  const today = new Date().toISOString().slice(0, 10);
  return (
    <form
      action={action}
      onReset={onReset}
      className="space-y-5 rounded-[2rem] bg-white p-6 ring-1 ring-linha sm:p-8"
      noValidate
    >
      <Field id="destinationId" label="Para onde?" errors={e("destinationId")}>
        <select
          id="destinationId"
          name="destinationId"
          required
          defaultValue={initialDestinationId}
          className={inputClass}
          aria-describedby={describedBy("destinationId", e("destinationId"))}
        >
          <option value="" disabled>
            Escolha o destino…
          </option>
          {destinations.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}, {d.state}
            </option>
          ))}
        </select>
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field id="startDate" label="Ida" errors={e("startDate")}>
          <input
            id="startDate"
            name="startDate"
            type="date"
            min={today}
            required
            className={inputClass}
          />
        </Field>
        <Field id="endDate" label="Volta" errors={e("endDate")}>
          <input
            id="endDate"
            name="endDate"
            type="date"
            min={today}
            required
            className={inputClass}
            aria-describedby={describedBy("endDate", e("endDate"))}
          />
        </Field>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field id="travelers" label="Quantas pessoas" errors={e("travelers")}>
          <input
            id="travelers"
            name="travelers"
            type="number"
            min={1}
            max={50}
            defaultValue={2}
            required
            className={inputClass}
          />
        </Field>
        <Field id="budget" label="Orçamento total (R$)" optional errors={e("budget")}>
          <input
            id="budget"
            name="budget"
            inputMode="decimal"
            placeholder="5.000"
            className={inputClass}
          />
        </Field>
      </div>
      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold">Preferências</legend>
        <div className="flex flex-wrap gap-2">
          {travelTags.map((t) => (
            <label
              key={t.value}
              className="cursor-pointer rounded-full border border-linha px-3 py-1.5 text-sm has-checked:border-petroleo has-checked:bg-petroleo-100 has-checked:text-petroleo has-focus-visible:outline-3 has-focus-visible:outline-agua"
            >
              <input type="checkbox" name="preferences" value={t.value} className="sr-only" />
              {t.label}
            </label>
          ))}
        </div>
      </fieldset>
      <Field
        id="about"
        label="Conte sobre você"
        optional
        hint="Com quem você vai, seu ritmo, do que gosta e do que não gosta. Usamos isso para montar o seu roteiro."
        errors={e("about")}
      >
        <textarea
          id="about"
          name="about"
          rows={5}
          maxLength={2000}
          placeholder="Ex.: Vou com minha esposa e nosso filho de 6 anos. Gostamos de praia e de comer bem, mas não curtimos balada. Preferimos um ritmo tranquilo e queremos economizar na hospedagem."
          className={inputClass}
          aria-describedby={describedBy("about", e("about"))}
        />
      </Field>
      <FormMessage state={state} />
      {signedIn ? (
        <SubmitButton pendingLabel="Buscando…" variant="accent" className="w-full">
          Ver sugestões
        </SubmitButton>
      ) : (
        <Link
          href="/login?next=/vou-viajar"
          className="flex w-full justify-center rounded-full bg-agua px-5 py-3 font-bold text-tinta hover:bg-agua-600"
        >
          Entre para salvar seu plano
        </Link>
      )}
    </form>
  );
}
