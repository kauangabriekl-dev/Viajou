import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { ALL_PHOTOS } from "@/lib/photos";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Créditos das fotos",
  description: "Autores e licenças das fotos de paisagem usadas no VIAJOU.",
  path: "/creditos",
});

/** Crédito completo de cada foto de licença livre (exigência das licenças Creative Commons). */
export default function CreditsPage() {
  return (
    <Container className="max-w-4xl py-12 sm:py-16">
      <h1 className="text-4xl tracking-tight text-petroleo sm:text-5xl">
        <span className="font-light">Créditos das </span>
        <span className="font-bold">fotos</span>
      </h1>
      <p className="mt-4 max-w-prose font-light text-tinta-soft">
        As fotos de paisagem do site são de licença livre, publicadas no Wikimedia Commons. Fotos de
        relatos, avaliações e reclamações são enviadas pelos próprios viajantes.
      </p>
      <ul className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
        {ALL_PHOTOS.map((photo) => (
          <li
            key={photo.src}
            className="overflow-hidden rounded-[var(--radius-card)] bg-white ring-1 ring-linha"
          >
            <div className="relative aspect-[16/9]">
              <Image
                src={photo.src}
                alt={photo.title}
                fill
                sizes="(min-width: 640px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
            <div className="space-y-1 p-5 text-sm">
              <p className="font-semibold text-petroleo">{photo.title}</p>
              <p className="text-tinta-soft">Autor: {photo.author}</p>
              <p className="text-tinta-soft">
                Licença:{" "}
                <a
                  href={photo.licenseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-petroleo underline"
                >
                  {photo.license}
                </a>
              </p>
              <a
                href={photo.source}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block pt-1 font-medium text-petroleo underline"
              >
                Ver a foto original
              </a>
            </div>
          </li>
        ))}
      </ul>

      <section aria-labelledby="dados-title" className="mt-14 space-y-3">
        <h2 id="dados-title" className="text-2xl font-bold text-petroleo">
          Países e cidades do globo
        </h2>
        <p className="max-w-prose font-light text-tinta-soft">
          A busca do globo usa dados do{" "}
          <a
            href="https://www.geonames.org"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-petroleo underline"
          >
            GeoNames
          </a>
          , sob a licença{" "}
          <a
            href="https://creativecommons.org/licenses/by/4.0/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-petroleo underline"
          >
            CC BY 4.0
          </a>
          : todos os países e as cidades com mais de mil habitantes. Os nomes de países em português
          vêm do próprio navegador.
        </p>
      </section>
    </Container>
  );
}
