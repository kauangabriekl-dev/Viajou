import type { ReactNode } from "react";

type FieldProps = {
  id: string;
  label: string;
  hint?: string;
  errors?: string[];
  children: ReactNode;
  optional?: boolean;
};

/** Label + controle + dica + erro, com aria-describedby ligado ao controle via ids. */
export function Field({ id, label, hint, errors, children, optional }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-semibold text-tinta">
        {label}
        {optional && <span className="font-normal text-tinta-soft"> (opcional)</span>}
      </label>
      {children}
      {hint && !errors?.length && (
        <p id={`${id}-hint`} className="text-xs text-tinta-soft">
          {hint}
        </p>
      )}
      {errors?.length ? (
        <p id={`${id}-error`} className="text-sm font-medium text-red-700" role="alert">
          {errors[0]}
        </p>
      ) : null}
    </div>
  );
}

export const inputClass =
  "block w-full rounded-xl border border-linha bg-white px-3.5 py-2.5 text-tinta placeholder:text-tinta-soft/70 focus:border-petroleo focus:ring-2 focus:ring-petroleo/20 focus:outline-none aria-invalid:border-red-600";

export function describedBy(id: string, errors?: string[], hint?: string) {
  if (errors?.length) return `${id}-error`;
  return hint ? `${id}-hint` : undefined;
}
