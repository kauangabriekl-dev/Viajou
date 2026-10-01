import { MessagesSquare, Route, Star, Wallet } from "lucide-react";
import { Container } from "@/components/ui/Container";

const items = [
  {
    icon: Star,
    title: "Notas por critério",
    text: "Limpeza, atendimento, comida, custo-benefício: cada tipo de lugar tem os critérios que importam.",
  },
  {
    icon: Wallet,
    title: "Gastos de verdade",
    text: "Relatos com datas, duração e quanto a viagem custou, para planejar sem surpresa.",
  },
  {
    icon: Route,
    title: "Roteiros dia a dia",
    text: "Parada por parada. Copie o roteiro de quem já foi e ajuste ao seu jeito.",
  },
  {
    icon: MessagesSquare,
    title: "Reclamações com resposta",
    text: "Problemas ficam públicos e estabelecimentos verificados respondem na própria página.",
  },
];

/** O que o VIAJOU oferece, em quatro pontos (faixa de benefícios). */
export function Benefits() {
  return (
    <Container>
      <section aria-labelledby="beneficios-title">
        <h2 id="beneficios-title" className="sr-only">
          Por que usar o VIAJOU
        </h2>
        <ul className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {items.map(({ icon: Icon, title, text }) => (
            <li key={title} className="space-y-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-agua/25 text-petroleo">
                <Icon aria-hidden="true" className="h-6 w-6" />
              </span>
              <h3 className="text-lg font-semibold text-petroleo">{title}</h3>
              <p className="text-sm font-light text-tinta-soft">{text}</p>
            </li>
          ))}
        </ul>
      </section>
    </Container>
  );
}
