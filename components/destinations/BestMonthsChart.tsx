import { monthLong, monthShort } from "@/lib/labels";
import { pluralize } from "@/utils/format";

/**
 * "Melhor época": quantas pessoas recomendam cada mês. Uma série só (sem legenda: o título
 * nomeia), uma cor (petróleo), barras finas com topo arredondado e 2px de folga entre elas.
 * Cada barra tem dica no hover/foco; a lista em texto logo abaixo é a alternativa acessível.
 */
export function BestMonthsChart({ votes }: { votes: number[] }) {
  const max = Math.max(...votes);
  if (max === 0) return null;
  const top = votes
    .map((n, i) => ({ n, i }))
    .filter((m) => m.n > 0)
    .sort((a, b) => b.n - a.n || a.i - b.i)
    .slice(0, 3);
  const topSet = new Set(top.map((m) => m.i));

  return (
    <figure className="space-y-3">
      <figcaption className="text-sm font-semibold text-tinta">Meses mais recomendados</figcaption>
      <div
        className="grid h-28 grid-cols-12 items-end gap-[2px] border-b border-linha"
        aria-hidden="true"
      >
        {votes.map((n, i) => (
          <div key={i} className="group relative flex h-full items-end justify-center">
            <div
              tabIndex={-1}
              className={`w-full max-w-5 rounded-t-[4px] ${topSet.has(i) ? "bg-petroleo" : "bg-petroleo/35"}`}
              style={{ height: n ? `${Math.max(8, (n / max) * 100)}%` : "2px" }}
            />
            <span className="pointer-events-none absolute bottom-full mb-1 hidden rounded-md bg-tinta px-2 py-1 text-[11px] whitespace-nowrap text-white group-hover:block">
              {monthLong[i]}: {pluralize(n, "pessoa", "pessoas")}
            </span>
          </div>
        ))}
      </div>
      <div
        className="grid grid-cols-12 gap-[2px] text-center text-[10px] text-tinta-soft"
        aria-hidden="true"
      >
        {monthShort.map((m, i) => (
          <span key={m} className={topSet.has(i) ? "font-semibold text-tinta" : ""}>
            {m}
          </span>
        ))}
      </div>
      <p className="text-sm text-tinta-soft">
        Mais recomendados:{" "}
        <strong className="font-semibold text-tinta">
          {top.map((m) => monthLong[m.i]).join(", ")}
        </strong>
        <span className="sr-only">
          . Votos por mês: {votes.map((n, i) => `${monthLong[i]} ${n}`).join(", ")}.
        </span>
      </p>
    </figure>
  );
}
