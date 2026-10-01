import { AchadoForm } from "@/components/achados/AchadoForm";
import { Container } from "@/components/ui/Container";
import { requireSession } from "@/lib/auth";
import { buildMetadata } from "@/lib/seo";

export const metadata = {
  ...buildMetadata({ title: "Postar um achadinho", path: "/achados/novo" }),
  robots: { index: false },
};

export default async function NewAchadoPage() {
  await requireSession("/achados/novo");
  return (
    <Container className="max-w-2xl py-10 sm:py-14">
      <h1 className="text-3xl tracking-tight text-petroleo sm:text-4xl">
        <span className="font-light">Postar um </span>
        <span className="font-bold">achadinho</span>
      </h1>
      <p className="mt-3 mb-8 font-light text-tinta-soft">
        Um lugar especial que você encontrou: foto, o que tem de bom e o ponto exato no mapa para
        outras pessoas chegarem lá.
      </p>
      <AchadoForm />
    </Container>
  );
}
