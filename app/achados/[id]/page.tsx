import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Navigation } from "lucide-react";
import { z } from "zod";
import { AchadoSaveButton, DeleteAchado } from "@/components/achados/AchadoActions";
import { AchadosMap } from "@/components/achados/AchadosMap";
import { ReportButton } from "@/components/social/ReportButton";
import { Avatar } from "@/components/ui/Avatar";
import { Container } from "@/components/ui/Container";
import { getSession } from "@/lib/auth";
import { achadoCategoryLabel } from "@/lib/labels";
import { getAchado, viewerSavedAchado } from "@/lib/queries";
import { buildMetadata } from "@/lib/seo";
import { photoUrl } from "@/lib/storage";
import { formatRelativeDate } from "@/utils/format";

async function load(id: string) {
  return z.uuid().safeParse(id).success ? getAchado(id) : null;
}

export async function generateMetadata({ params }: PageProps<"/achados/[id]">) {
  const { id } = await params;
  const achado = await load(id);
  if (!achado) return buildMetadata({ title: "Achadinho", path: `/achados/${id}` });
  return buildMetadata({
    title: `${achado.title}${achado.location_name ? ` · ${achado.location_name}` : ""}`,
    description: achado.body.slice(0, 160),
    path: `/achados/${id}`,
  });
}

export default async function AchadoPage({ params }: PageProps<"/achados/[id]">) {
  const { id } = await params;
  const achado = await load(id);
  if (!achado) notFound();
  const session = await getSession();
  const saved = await viewerSavedAchado(session?.userId, achado.id);
  const coords = `${achado.latitude},${achado.longitude}`;

  return (
    <Container className="max-w-4xl space-y-8 py-10 sm:py-14">
      <Link href="/achados" className="text-sm font-semibold text-petroleo underline">
        Todos os achadinhos
      </Link>
      <header className="space-y-3">
        <p className="text-xs font-semibold tracking-[0.18em] text-agua-700 uppercase">
          {achadoCategoryLabel(achado.category)}
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-petroleo sm:text-5xl">
          {achado.title}
        </h1>
        {achado.location_name && <p className="text-tinta-soft">{achado.location_name}</p>}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${coords}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-agua px-5 text-sm font-semibold text-tinta hover:bg-agua-600"
          >
            <Navigation aria-hidden="true" className="h-4 w-4" />
            Como chegar
          </a>
          <AchadoSaveButton
            achadoId={achado.id}
            saved={saved}
            count={achado.saves}
            signedIn={Boolean(session)}
          />
          {session?.userId === achado.user_id ? (
            <DeleteAchado achadoId={achado.id} />
          ) : (
            <ReportButton targetType="achado" targetId={achado.id} signedIn={Boolean(session)} />
          )}
        </div>
      </header>

      {achado.photos.length > 0 && (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {achado.photos.map((p, i) => (
            <li key={p.id} className={i === 0 ? "sm:col-span-2" : ""}>
              <Image
                src={photoUrl(p.storage_path)}
                alt={p.alt ?? `${achado.title}, foto ${i + 1}`}
                width={1200}
                height={800}
                priority={i === 0}
                className="aspect-[3/2] w-full rounded-2xl object-cover"
              />
            </li>
          ))}
        </ul>
      )}

      <section className="space-y-4">
        <p className="max-w-prose text-lg font-light whitespace-pre-line">{achado.body}</p>
        {achado.tip && (
          <div className="max-w-prose rounded-2xl bg-petroleo-100 p-5">
            <p className="text-sm font-semibold text-petroleo">Dica para chegar</p>
            <p className="mt-1 whitespace-pre-line text-tinta">{achado.tip}</p>
          </div>
        )}
        <Link
          href={`/perfil/${achado.author.username}`}
          className="flex items-center gap-2 text-sm text-tinta-soft"
        >
          <Avatar name={achado.author.full_name} src={achado.author.avatar_url} size="sm" />
          Achado por {achado.author.full_name} · {formatRelativeDate(achado.created_at)}
        </Link>
        {achado.destination && (
          <p className="text-sm">
            Perto de{" "}
            <Link
              href={`/destinos/${achado.destination.slug}`}
              className="font-semibold text-petroleo underline"
            >
              {achado.destination.name}, {achado.destination.state}
            </Link>
          </p>
        )}
      </section>

      <section aria-labelledby="mapa-achado" className="space-y-3">
        <h2 id="mapa-achado" className="text-xl font-semibold text-petroleo">
          No mapa
        </h2>
        <AchadosMap
          points={[
            {
              id: achado.id,
              title: achado.title,
              latitude: achado.latitude,
              longitude: achado.longitude,
            },
          ]}
          zoom={15}
        />
        <p className="text-sm text-tinta-soft tabular-nums">
          Coordenadas: {achado.latitude.toFixed(6)}, {achado.longitude.toFixed(6)} ·{" "}
          <a
            href={`https://www.openstreetmap.org/?mlat=${achado.latitude}&mlon=${achado.longitude}#map=16/${coords.replace(",", "/")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            abrir no OpenStreetMap
          </a>
        </p>
      </section>
    </Container>
  );
}
