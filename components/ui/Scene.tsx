export type SceneKind = "beach" | "mountain" | "city";

/** Escolhe uma paisagem ilustrativa a partir de pistas no texto (sem foto disponível). */
export function sceneFor(...hints: (string | null | undefined)[]): SceneKind {
  const text = hints.filter(Boolean).join(" ").toLowerCase();
  if (/serra|montanha|natureza|trilha|gramado|campos|chal[eé]/.test(text)) return "mountain";
  if (/cidade|urban|centro|hist[oó]ria|rio de janeiro|s[aã]o paulo|museu/.test(text)) return "city";
  return "beach";
}

/**
 * Ilustração vetorial usada como placeholder de imagem.
 * Evita fotos de terceiros até existirem uploads reais dos usuários.
 */
export function Scene({ kind, className = "" }: { kind: SceneKind; className?: string }) {
  return (
    <svg
      viewBox="0 0 320 180"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      aria-hidden="true"
    >
      <rect width="320" height="180" fill={kind === "mountain" ? "#e3eef2" : "#cfe6ee"} />
      <circle cx={kind === "city" ? 250 : 230} cy="62" r="24" fill="var(--color-maracuja)" />
      {kind === "beach" && (
        <>
          <path d="M0 108h320v72H0z" fill="var(--color-atlantico)" />
          <path d="M0 118c40-8 80 8 120 0s80-8 120 0 60 8 80 4v58H0z" fill="#1c6f8f" />
          <path d="M0 150c60-12 140-10 200 2s100 8 120 4v24H0z" fill="#f1e1b8" />
          <path
            d="M52 150c2-24 0-40-6-54M46 96c-10-4-20 0-24 6M46 96c8-8 18-8 24-4M46 96c-2-10 4-18 10-20"
            stroke="var(--color-restinga)"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
        </>
      )}
      {kind === "mountain" && (
        <>
          <path d="M0 150 70 70l50 50 40-40 80 70H0z" fill="var(--color-restinga)" />
          <path d="M120 150 200 60l120 90z" fill="#1f5e4c" />
          <path d="M0 140h320v40H0z" fill="#2a4f45" />
          <path d="M40 140v-18l8-14 8 14v18M250 140v-22l9-16 9 16v22" fill="#173b31" />
        </>
      )}
      {kind === "city" && (
        <>
          <path d="M0 132 60 70l40 34 50-58 60 86z" fill="var(--color-restinga)" />
          <path
            d="M150 132h16v-40h14v40h10V80h18v52h12v-28h16v28h84v48H150z"
            fill="var(--color-atlantico-900)"
          />
          <path d="M0 132h320v48H0z" fill="var(--color-atlantico)" />
          <path
            d="M0 146c50-6 100 6 160 0s110-6 160 0"
            stroke="#5fa3bd"
            strokeWidth="2"
            fill="none"
          />
        </>
      )}
    </svg>
  );
}
