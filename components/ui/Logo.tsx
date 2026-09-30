import Link from "next/link";

/** Marca: um "pin" formado por sol sobre o horizonte. */
export function Logo() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2 rounded-md"
      aria-label="VIAJOU, página inicial"
    >
      <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden="true">
        <path
          d="M16 2c6.6 0 12 5.2 12 11.7C28 22 16 30 16 30S4 22 4 13.7C4 7.2 9.4 2 16 2Z"
          fill="var(--color-atlantico)"
        />
        <circle cx="16" cy="12.5" r="4.2" fill="var(--color-maracuja)" />
        <path d="M8.5 17.5h15" stroke="var(--color-espuma)" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <span className="text-xl font-extrabold tracking-tight text-atlantico">viajou</span>
    </Link>
  );
}
