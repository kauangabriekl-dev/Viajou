import { Search } from "lucide-react";

type SearchBarProps = {
  defaultValue?: string;
  placeholder?: string;
  size?: "md" | "lg";
};

/**
 * Busca global. Formulário GET simples: funciona sem JavaScript e gera URL compartilhável.
 * A busca agrupada (destinos, lugares, usuários, roteiros) entra na fase 11.
 */
export function SearchBar({
  defaultValue,
  placeholder = "Pesquise um destino, hotel, restaurante ou atração...",
  size = "md",
}: SearchBarProps) {
  const large = size === "lg";
  return (
    <form action="/explorar" method="get" role="search" className="w-full">
      <label htmlFor="busca-global" className="sr-only">
        Para onde você quer viajar?
      </label>
      <div
        className={`flex items-center gap-2 rounded-full bg-white shadow-[0_12px_40px_-12px_rgba(7,52,71,0.45)] ring-1 ring-linha ${
          large ? "p-2 pl-5" : "p-1.5 pl-4"
        }`}
      >
        <Search aria-hidden="true" className="h-5 w-5 shrink-0 text-atlantico" />
        <input
          id="busca-global"
          name="q"
          type="search"
          defaultValue={defaultValue}
          placeholder={placeholder}
          autoComplete="off"
          maxLength={120}
          className={`min-w-0 flex-1 bg-transparent text-tinta placeholder:text-tinta-soft/80 focus:outline-none ${
            large ? "py-2 text-base sm:text-lg" : "py-1.5 text-sm"
          }`}
        />
        <button
          type="submit"
          aria-label="Buscar"
          className={`inline-flex shrink-0 items-center justify-center rounded-full bg-maracuja font-bold text-tinta hover:bg-maracuja-600 ${
            large ? "h-12 w-12 sm:h-auto sm:w-auto sm:px-5 sm:py-3" : "px-4 py-2 text-sm"
          }`}
        >
          {large ? (
            <>
              <Search aria-hidden="true" className="h-5 w-5 sm:hidden" />
              <span className="hidden sm:inline">Buscar</span>
            </>
          ) : (
            "Buscar"
          )}
        </button>
      </div>
    </form>
  );
}
