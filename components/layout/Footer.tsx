import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Logo } from "@/components/ui/Logo";

const groups = [
  {
    title: "Descobrir",
    links: [
      { href: "/destinos", label: "Destinos" },
      { href: "/explorar", label: "Explorar lugares" },
      { href: "/roteiros", label: "Roteiros" },
      { href: "/vou-viajar", label: "Vou viajar" },
    ],
  },
  {
    title: "Participar",
    links: [
      { href: "/cadastro", label: "Criar conta" },
      { href: "/criar", label: "Publicar uma viagem" },
      { href: "/criar/roteiro", label: "Montar um roteiro" },
    ],
  },
  {
    title: "Sobre",
    links: [{ href: "/creditos", label: "Créditos das fotos" }],
  },
];

export function Footer() {
  return (
    <footer className="relative mt-24 overflow-hidden bg-petroleo-950 pb-24 text-white lg:pb-0">
      <svg
        aria-hidden="true"
        viewBox="0 0 1440 160"
        preserveAspectRatio="none"
        className="absolute inset-x-0 top-0 h-24 w-full opacity-40"
      >
        <path
          d="M-20 130 C 380 20, 980 20, 1460 110"
          fill="none"
          stroke="var(--color-agua)"
          strokeWidth="1.5"
          strokeDasharray="3 8"
        />
      </svg>
      <Container className="relative grid grid-cols-1 gap-10 py-14 sm:grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(0,1fr))]">
        <div className="max-w-xs space-y-3">
          <Logo tone="light" />
          <p className="text-sm font-light text-white/75">
            Experiências reais de quem já esteve lá. Avaliações, relatos e roteiros escritos por
            viajantes, não por anunciantes.
          </p>
        </div>
        {groups.map((group) => (
          <div key={group.title}>
            <h2 className="text-sm font-semibold text-agua">{group.title}</h2>
            <ul className="mt-3 space-y-2">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-white/80 hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Container>
      <Container className="relative border-t border-white/10 py-6 text-xs text-white/60">
        © {new Date().getFullYear()} VIAJOU. Projeto em desenvolvimento.
      </Container>
    </footer>
  );
}
