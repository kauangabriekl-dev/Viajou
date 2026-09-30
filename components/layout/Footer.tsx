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
];

export function Footer() {
  return (
    <footer className="mt-24 border-t border-linha bg-white pb-24 lg:pb-0">
      <Container className="grid gap-10 py-12 sm:grid-cols-[1.5fr_1fr_1fr]">
        <div className="max-w-xs space-y-3">
          <Logo />
          <p className="text-sm text-tinta-soft">Experiências reais de quem já esteve lá.</p>
        </div>
        {groups.map((group) => (
          <div key={group.title}>
            <h2 className="text-sm font-bold text-tinta">{group.title}</h2>
            <ul className="mt-3 space-y-2">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-tinta-soft hover:text-atlantico">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Container>
      <Container className="border-t border-linha py-6 text-xs text-tinta-soft">
        © {new Date().getFullYear()} VIAJOU. Projeto em desenvolvimento.
      </Container>
    </footer>
  );
}
