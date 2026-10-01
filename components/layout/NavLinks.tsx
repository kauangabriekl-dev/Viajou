"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { mainNav } from "@/lib/navigation";

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

/** Barra de navegação fixa no rodapé em telas pequenas (mobile-first). */
export function MobileNav({ signedIn }: { signedIn: boolean }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-linha bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      <ul className="grid grid-cols-5">
        {mainNav(signedIn).map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold ${
                  active ? "text-petroleo" : "text-tinta-soft"
                }`}
              >
                <Icon aria-hidden="true" className="h-6 w-6" strokeWidth={active ? 2.4 : 1.8} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
