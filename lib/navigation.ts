import {
  BedDouble,
  CirclePlus,
  CircleUserRound,
  Compass,
  House,
  MapPinned,
  Plane,
  Route,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon };

/** Barra inferior do celular: os 4 caminhos principais (o 5º botão é "Mais"). */
export function mainNav(): NavItem[] {
  return [
    { href: "/", label: "Início", icon: House },
    { href: "/destinos", label: "Destinos", icon: MapPinned },
    { href: "/vou-viajar", label: "Vou viajar", icon: Plane },
    { href: "/roteiros", label: "Roteiros", icon: Route },
  ];
}

/** O que fica no "Mais" do celular. */
export function moreNav(signedIn: boolean): NavItem[] {
  return [
    { href: "/explorar", label: "Explorar", icon: Compass },
    { href: "/achados", label: "Achadinhos", icon: Sparkles },
    { href: "/hospedagem", label: "Hospedagem", icon: BedDouble },
    { href: "/criar", label: "Publicar", icon: CirclePlus },
    signedIn
      ? { href: "/minha-conta", label: "Minha conta", icon: CircleUserRound }
      : { href: "/login", label: "Entrar", icon: CircleUserRound },
  ];
}
