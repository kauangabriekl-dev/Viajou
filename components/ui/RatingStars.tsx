import { Star } from "lucide-react";

type RatingStarsProps = { value: number; max?: number; size?: number };

/** Exibição somente leitura. O seletor interativo é o StarInput. */
export function RatingStars({ value, max = 5, size = 16 }: RatingStarsProps) {
  const rounded = Math.round(value);
  return (
    <span
      className="inline-flex items-center gap-0.5"
      role="img"
      aria-label={`Nota ${Number.isInteger(value) ? value : value.toFixed(1).replace(".", ",")} de ${max}`}
    >
      {Array.from({ length: max }, (_, i) => (
        <Star
          key={i}
          width={size}
          height={size}
          aria-hidden="true"
          className={i < rounded ? "fill-maracuja text-maracuja" : "fill-none text-linha"}
        />
      ))}
    </span>
  );
}
