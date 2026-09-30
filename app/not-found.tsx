import Link from "next/link";
import { Container } from "@/components/ui/Container";

export default function NotFound() {
  return (
    <Container className="py-24">
      <div className="max-w-lg space-y-4">
        <h1 className="text-3xl font-extrabold tracking-tight">Esta página não existe.</h1>
        <p className="text-tinta-soft">
          O endereço pode ter mudado, ou este conteúdo ainda não foi criado.
        </p>
        <Link
          href="/"
          className="inline-flex rounded-full bg-atlantico px-5 py-3 font-semibold text-white"
        >
          Voltar para o início
        </Link>
      </div>
    </Container>
  );
}
