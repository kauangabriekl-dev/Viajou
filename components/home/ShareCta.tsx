import Link from "next/link";
import { Container } from "@/components/ui/Container";

export function ShareCta() {
  return (
    <Container>
      <section
        aria-labelledby="cta-title"
        className="grid gap-6 rounded-[2rem] bg-atlantico px-6 py-12 text-white sm:grid-cols-[1fr_auto] sm:items-center sm:px-12"
      >
        <div className="space-y-2">
          <h2 id="cta-title" className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Compartilhe sua próxima viagem.
          </h2>
          <p className="max-w-md text-white/80">
            O que valeu a pena, quanto custou e o que você faria diferente. Seu relato ajuda quem
            vai depois.
          </p>
        </div>
        <Link
          href="/cadastro"
          className="inline-flex justify-center rounded-full bg-maracuja px-6 py-3 font-bold text-tinta hover:bg-maracuja-600"
        >
          Criar conta gratuita
        </Link>
      </section>
    </Container>
  );
}
