import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { PhotoCredit } from "@/components/ui/PhotoCredit";
import { DESTINATION_PHOTOS } from "@/lib/photos";

/** Respostas que descrevem regras reais do produto (ver .claude/skills/travel-platform-rules). */
const questions = [
  {
    q: "O VIAJOU é uma agência de viagens?",
    a: "Não. É uma rede de viajantes: aqui você lê avaliações, relatos e roteiros de quem já esteve no lugar. Não vendemos pacotes nem reservas.",
  },
  {
    q: "Estabelecimentos podem pagar para mudar uma nota?",
    a: "Não. Nenhum estabelecimento paga para alterar nota, ordem ou visibilidade de avaliações. Depois de verificados, eles podem apenas responder às reclamações.",
  },
  {
    q: "Posso avaliar o mesmo lugar mais de uma vez?",
    a: "Não. É uma avaliação por pessoa em cada lugar, para que a nota represente a experiência de pessoas diferentes.",
  },
  {
    q: "Como funciona o Vou viajar?",
    a: "Você informa destino, datas, número de pessoas, orçamento e estilo. O VIAJOU cruza isso com roteiros, lugares e relatos da comunidade, começando pelos roteiros com duração parecida com a da sua viagem.",
  },
  {
    q: "Posso usar o roteiro de outra pessoa?",
    a: "Sim. Copiar cria uma versão privada na sua conta, que você ajusta como quiser. O roteiro original não muda.",
  },
  {
    q: "O que acontece quando denuncio um conteúdo?",
    a: "A denúncia vai para revisão humana. Nada é escondido automaticamente, para que denúncias não virem ferramenta de censura entre usuários ou concorrentes.",
  },
];

const photo = DESTINATION_PHOTOS["florianopolis-sc"];

/** Perguntas frequentes com <details>: abre e fecha sem JavaScript. */
export function Faq() {
  return (
    <Container>
      <section
        aria-labelledby="faq-title"
        className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"
      >
        <div className="space-y-6">
          <p className="text-xs font-semibold tracking-[0.18em] text-agua-700 uppercase">
            Antes de começar
          </p>
          <h2
            id="faq-title"
            className="text-3xl leading-tight tracking-tight text-petroleo sm:text-4xl"
          >
            <span className="font-light">Perguntas </span>
            <span className="font-bold">frequentes</span>
          </h2>
          <figure className="hidden lg:block">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[2.5rem] rounded-tr-[6rem]">
              <Image
                src={photo.src}
                alt="Praias e dunas de Florianópolis vistas do alto"
                fill
                sizes="40vw"
                className="object-cover"
              />
            </div>
            <PhotoCredit credit={photo} className="mt-2 text-tinta-soft" />
          </figure>
        </div>
        <ul className="divide-y divide-linha border-y border-linha">
          {questions.map(({ q, a }) => (
            <li key={q}>
              <details className="group py-2">
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 rounded-lg text-left text-lg font-medium text-petroleo [&::-webkit-details-marker]:hidden">
                  {q}
                  <ChevronDown
                    aria-hidden="true"
                    className="h-8 w-8 shrink-0 rounded-full bg-petroleo-100 p-1.5 transition-transform group-open:rotate-180"
                  />
                </summary>
                <p className="pb-4 font-light text-tinta-soft">{a}</p>
              </details>
            </li>
          ))}
        </ul>
      </section>
    </Container>
  );
}
