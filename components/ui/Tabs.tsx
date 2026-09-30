import Link from "next/link";

type Tab = { key: string; label: string; count?: number };

/** Abas como links (?aba=): funcionam sem JS, são compartilháveis e indexáveis. */
export function Tabs({
  tabs,
  active,
  basePath,
  label,
}: {
  tabs: Tab[];
  active: string;
  basePath: string;
  label: string;
}) {
  return (
    <nav
      aria-label={label}
      className="relative -mx-4 overflow-x-auto border-b border-linha px-4 sm:mx-0 sm:px-0"
    >
      <ul className="flex gap-1">
        {tabs.map((tab, i) => {
          const current = tab.key === active;
          return (
            <li key={tab.key}>
              <Link
                href={i === 0 ? basePath : `${basePath}?aba=${tab.key}`}
                aria-current={current ? "page" : undefined}
                scroll={false}
                className={`inline-flex items-center gap-1.5 border-b-2 px-4 py-3 text-sm font-semibold whitespace-nowrap ${
                  current
                    ? "border-atlantico text-atlantico"
                    : "border-transparent text-tinta-soft hover:text-tinta"
                }`}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span className="text-xs tabular-nums opacity-70">{tab.count}</span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
