"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { mainNav, moreNav } from "@/lib/navigation";

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

/** Links do header em telas médias e grandes. */
export function DesktopNav() {
  const pathname = usePathname();
  const items = [
    { href: "/explorar", label: "Explorar" },
    { href: "/destinos", label: "Destinos" },
    { href: "/achados", label: "Achadinhos" },
    { href: "/roteiros", label: "Roteiros" },
    { href: "/hospedagem", label: "Hospedagem" },
    { href: "/vou-viajar", label: "Vou viajar" },
  ];
  return (
    <nav aria-label="Principal" className="hidden lg:block">
      <ul className="flex items-center gap-1">
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  active ? "bg-petroleo-100 text-petroleo" : "text-tinta-soft hover:text-tinta"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/**
 * Barra de navegação fixa no rodapé em telas pequenas (mobile-first): 4 caminhos
 * principais e um botão "Mais" que abre o resto num painel acima da barra.
 */
export function MobileNav({ signedIn }: { signedIn: boolean }) {
  const pathname = usePathname();
  // Guarda em que página o painel foi aberto: ao navegar, ele fecha sozinho.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const more = moreNav(signedIn);
  const moreActive = more.some((item) => isActive(pathname, item.href));
  const itemClass = (active: boolean) =>
    `flex w-full flex-col items-center gap-1 py-2.5 text-[11px] font-semibold ${
      active ? "text-petroleo" : "text-tinta-soft"
    }`;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenOn(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Fechar menu"
          tabIndex={-1}
          onClick={() => setOpenOn(null)}
          className="fixed inset-0 z-30 bg-tinta/30 lg:hidden"
        />
      )}
      <nav
        aria-label="Principal"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-linha bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      >
        {open && (
          <ul
            id="menu-mais"
            className="grid grid-cols-3 gap-1 border-b border-linha bg-white px-3 py-3"
          >
            {more.map((item) => {
              const active = isActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setOpenOn(null)}
                    className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl text-xs font-semibold ${
                      active ? "bg-petroleo-100 text-petroleo" : "text-tinta hover:bg-espuma"
                    }`}
                  >
                    <Icon aria-hidden="true" className="h-5 w-5" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
        <ul className="grid grid-cols-5">
          {mainNav().map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={itemClass(active)}
                >
                  <Icon aria-hidden="true" className="h-6 w-6" strokeWidth={active ? 2.4 : 1.8} />
                  {item.label}
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              aria-expanded={open}
              aria-controls="menu-mais"
              onClick={() => setOpenOn(open ? null : pathname)}
              className={itemClass(open || moreActive)}
            >
              {open ? (
                <X aria-hidden="true" className="h-6 w-6" strokeWidth={2.4} />
              ) : (
                <Menu aria-hidden="true" className="h-6 w-6" strokeWidth={moreActive ? 2.4 : 1.8} />
              )}
              Mais
            </button>
          </li>
        </ul>
      </nav>
    </>
  );
}
