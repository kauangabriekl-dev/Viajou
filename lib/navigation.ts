import { CirclePlus, CircleUserRound, Compass, House, Route, type LucideIcon } from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon };

/** Navegação principal, compartilhada entre o header (desktop) e a barra inferior (mobile). */
export function mainNav(signedIn: boolean): NavItem[] {
  return [
    { href: "/", label: "Início", icon: House },
    { href: "/explorar", label: "Explorar", icon: Compass },
    { href: "/criar", label: "Publicar", icon: CirclePlus },
    { href: "/roteiros", label: "Roteiros", icon: Route },
    signedIn
      ? { href: "/minha-conta", label: "Conta", icon: CircleUserRound }
      : { href: "/login", label: "Entrar", icon: CircleUserRound },
  ];
}
