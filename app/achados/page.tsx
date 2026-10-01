import Link from "next/link";
import { CirclePlus } from "lucide-react";
import { AchadoCard } from "@/components/achados/AchadoCard";
import { AchadosMap } from "@/components/achados/AchadosMap";
import { SectionHeading } from "@/components/home/SectionHeading";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { listAchados } from "@/lib/queries";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Achadinhos",
  description: "Lugares especiais com foto e localização, marcados por quem já esteve lá.",
  path: "/achados",
});

export default async function AchadosPage() {
  const achados = await listAchados({ limit: 60 });
  return (
    <Container className="space-y-10 py-10 sm:py-14">
      <h1 className="sr-only">Achadinhos</h1>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading
          id="achados-title"
          as="h2"
          eyebrow="Com foto e localização"
          lead="Achadinhos de"
          title="viajantes"
          description="Prainhas escondidas, mirantes, cafés e trilhas que alguém encontrou e marcou no mapa para você ir também."
        />
        <Link
          href="/achados/novo"
          className="inline-flex min-h-12 items-center gap-2 rounded-full bg-agua px-6 font-semibold text-tinta hover:bg-agua-600"
        >
          <CirclePlus aria-hidden="true" className="h-5 w-5" />
          Postar um achadinho
        </Link>
      </div>

      {achados.length ? (
        <>
          <AchadosMap
            className="h-96"
            points={achados.map((a) => ({
              id: a.id,
              title: a.title,
              latitude: a.latitude,
              longitude: a.longitude,
              href: `/achados/${a.id}`,
            }))}
          />
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {achados.map((a) => (
              <li key={a.id}>
                <AchadoCard achado={a} />
              </li>
            ))}
          </ul>
        </>
      ) : (
        <EmptyState
          title="Nenhum achadinho ainda."
          description="Encontrou um lugar especial numa viagem? Marque no mapa e ajude quem vai depois."
          action={{ href: "/achados/novo", label: "Postar o primeiro" }}
        />
      )}
    </Container>
  );
}
