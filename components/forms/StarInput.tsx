"use client";

import { Star } from "lucide-react";
import { useState } from "react";

type StarInputProps = {
  name: string;
  label: string;
  required?: boolean;
  errors?: string[];
  compact?: boolean;
};

/** Seletor de 1 a 5 estrelas acessível: um grupo de radios estilizados. */
export function StarInput({ name, label, required, errors, compact }: StarInputProps) {
  const [value, setValue] = useState(0);
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  const size = compact ? "h-6 w-6" : "h-8 w-8";

  return (
    <fieldset className="space-y-1">
      <legend className={`font-semibold text-tinta ${compact ? "text-sm" : ""}`}>
        {label}
        {!required && <span className="font-normal text-tinta-soft"> (opcional)</span>}
      </legend>
      <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <label
            key={n}
            className="cursor-pointer rounded-md has-focus-visible:outline-3 has-focus-visible:outline-maracuja"
            onMouseEnter={() => setHover(n)}
          >
            <input
              type="radio"
              name={name}
              value={n}
              required={required && n === 1}
              checked={value === n}
              onChange={() => setValue(n)}
              className="sr-only"
            />
            <span className="sr-only">
              {n} {n === 1 ? "estrela" : "estrelas"}
            </span>
            <Star
              aria-hidden="true"
              className={`${size} ${n <= shown ? "fill-maracuja text-maracuja" : "text-linha"}`}
            />
          </label>
        ))}
        {!required && value > 0 && (
          <button
            type="button"
            onClick={() => setValue(0)}
            className="ml-2 text-xs text-tinta-soft underline"
          >
            Limpar
          </button>
        )}
      </div>
      {errors?.length ? (
        <p className="text-sm font-medium text-red-700" role="alert">
          {errors[0]}
        </p>
      ) : null}
    </fieldset>
  );
}
