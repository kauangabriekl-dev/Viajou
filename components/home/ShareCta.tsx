import Link from "next/link";
import { Container } from "@/components/ui/Container";

/** Convite para publicar, no formato dos painéis petróleo das referências: frase dividida + botão verde-água. */
export function ShareCta() {
  return (
    <Container>
      <section
        aria-labelledby="cta-title"
        className="relative overflow-hidden rounded-[2rem] bg-petroleo px-6 py-14 text-white sm:px-14"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 1000 300"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full opacity-40"
        >
          <path
            d="M-20 260 C 260 60, 700 40, 1020 180"
            fill="none"
            stroke="var(--color-agua)"
            strokeWidth="1.5"
            strokeDasharray="3 8"
          />
        </svg>
        <div className="relative grid grid-cols-1 gap-8 md:grid-cols-[minmax(0,1fr)_1px_minmax(0,1fr)] md:items-center md:gap-12">
          <h2 id="cta-title" className="text-4xl leading-tight tracking-tight sm:text-5xl">
            <span className="font-bold text-agua">Voltou</span>{" "}
            <span className="font-bold">de viagem?</span>
            <br />
            <span className="font-light">Conte como foi.</span>
          </h2>
          <span aria-hidden="true" className="hidden h-full bg-white/30 md:block" />
          <div className="space-y-6">
            <p className="text-lg font-light text-white/90">
              Quanto custou, onde ficou e o que valeu a pena.{" "}
              <strong className="font-semibold text-white">
                Seu relato ajuda a próxima pessoa a viajar sabendo onde ir.
              </strong>
            </p>
            <div className="flex flex-col items-start gap-2">
              <Link
                href="/criar"
                className="inline-flex min-h-12 items-center rounded-full bg-agua px-7 font-semibold text-tinta hover:bg-agua-600"
              >
                Publicar minha viagem
              </Link>
              <p className="text-xs text-white/70">É grátis e leva poucos minutos.</p>
            </div>
          </div>
        </div>
      </section>
    </Container>
  );
}
