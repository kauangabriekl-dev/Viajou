import Link from "next/link";

type LogoProps = { tone?: "dark" | "light" };

/** Marca: o planeta da home, com uma linha de trajeto e o destino em verde-água. */
export function Logo({ tone = "dark" }: LogoProps) {
  const light = tone === "light";
  return (
    <Link
      href="/"
      className="flex items-center gap-2 rounded-md"
      aria-label="VIAJOU, página inicial"
    >
      <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden="true">
        <circle cx="16" cy="16" r="14" fill={light ? "white" : "var(--color-petroleo)"} />
        <path
          d="M4.5 19c4-5.5 16-7.5 23-3"
          fill="none"
          stroke={light ? "var(--color-petroleo)" : "var(--color-petroleo-100)"}
          strokeWidth="1.8"
          strokeDasharray="1.6 2.6"
          strokeLinecap="round"
        />
        <circle cx="21.5" cy="12" r="4" fill="var(--color-agua)" />
      </svg>
      <span className={`text-xl tracking-tight ${light ? "text-white" : "text-petroleo"}`}>
        <span className="font-bold">via</span>
        <span className="font-light">jou</span>
      </span>
    </Link>
  );
}
