import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { Clock, Lock } from "lucide-react";
import { CopyItineraryButton, OwnerActions } from "@/components/itineraries/ItineraryOwnerActions";
import { LikeButton, SaveButton } from "@/components/social/Buttons";
import { ShareButton } from "@/components/social/ShareButton";
import { Avatar } from "@/components/ui/Avatar";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { SetupNotice } from "@/components/ui/SetupNotice";
import { getSession } from "@/lib/auth";
import { placeTypeLabels, tagLabel } from "@/lib/labels";
import { countOf, getItinerary, viewerItineraryState } from "@/lib/queries";
import { buildMetadata } from "@/lib/seo";
import { createClientIfConfigured } from "@/lib/supabase/server";
import { pluralize } from "@/utils/format";

async function load(id: string) {
  if (!z.uuid().safeParse(id).success) return null;
  const supabase = await createClientIfConfigured();
  return supabase ? { supabase, itinerary: await getItinerary(supabase, id) } : null;
}

export async function generateMetadata({ params }: PageProps<"/roteiros/[id]">) {
  const { id } = await params;
  const it = (await load(id))?.itinerary;
  if (!it) return buildMetadata({ title: "Roteiro", path: `/roteiros/${id}` });
  const meta = buildMetadata({
    title: it.title,
    description:
      it.description ??
      `Roteiro de ${pluralize(it.days_count, "dia", "dias")}${it.destination ? ` em ${it.destination.name}` : ""}.`,
    path: `/roteiros/${id}`,
  });
  return it.is_public ? meta : { ...meta, robots: { index: false } };
}

export default async function ItineraryPage({ params }: PageProps<"/roteiros/[id]">) {
  const { id } = await params;
  if (!(await createClientIfConfigured())) return <SetupNotice what="este roteiro" />;
  const loaded = await load(id);
  if (!loaded?.itinerary) notFound();
  const { supabase, itinerary: it } = loaded;

  const session = await getSession();
  const isOwner = session?.userId === it.user_id;
  const state = await viewerItineraryState(supabase, session?.userId, it.id);

  return (
    <Container className="max-w-3xl space-y-8 py-8 sm:py-12">
      <header className="space-y-4">
        {!it.is_public && (
          <p className="inline-flex items-center gap-1.5 rounded-full bg-linha px-3 py-1 text-xs font-bold text-tinta-soft">
            <Lock aria-hidden="true" className="h-3.5 w-3.5" /> Privado: só você vê
          </p>
        )}
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{it.title}</h1>
        <p className="text-tinta-soft">
          {pluralize(it.days_count, "dia", "dias")}
          {it.destination && (
            <>
              {" em "}
              <Link
                href={`/destinos/${it.destination.slug}`}
                className="font-semibold text-atlantico underline"
              >
                {it.destination.name}
              </Link>
            </>
          )}
        </p>
        {it.description && <p className="text-lg whitespace-pre-line">{it.description}</p>}
        {it.tags.length > 0 && (
          <ul className="flex flex-wrap gap-2" aria-label="Estilo">
            {it.tags.map((t) => (
              <li
                key={t}
                className="rounded-full bg-atlantico-100 px-3 py-1 text-xs font-semibold text-atlantico"
              >
                {tagLabel(t)}
              </li>
            ))}
          </ul>
        )}
        <Link
          href={`/perfil/${it.author.username}`}
          className="inline-flex items-center gap-2 text-sm"
        >
          <Avatar name={it.author.full_name} src={it.author.avatar_url} size="sm" />
          <span>
            Por <span className="font-bold">{it.author.full_name}</span>
          </span>
        </Link>
        <div className="flex flex-wrap items-center gap-1 border-y border-linha py-2">
          {it.is_public && (
            <>
              <LikeButton
                kind="itinerary"
                targetId={it.id}
                count={countOf(it.likes)}
                initialActive={state.liked}
                signedIn={Boolean(session)}
              />
              <SaveButton
                kind="itinerary"
                targetId={it.id}
                initialActive={state.saved}
                signedIn={Boolean(session)}
              />
              <ShareButton title={it.title} path={`/roteiros/${it.id}`} />
            </>
          )}
          {!isOwner && <CopyItineraryButton id={it.id} signedIn={Boolean(session)} />}
          {isOwner && <OwnerActions id={it.id} isPublic={it.is_public} />}
        </div>
      </header>

      {it.days.length === 0 ? (
        <EmptyState title="Este roteiro ainda não tem dias." />
      ) : (
        <ol className="space-y-6">
          {it.days.map((day) => (
            <li
              key={day.id}
              className="rounded-[var(--radius-card)] bg-white p-5 ring-1 ring-linha sm:p-6"
            >
              <h2 className="text-xl font-extrabold">
                <span className="text-maracuja-600">Dia {day.day_number}</span>
                {day.title && <span> · {day.title}</span>}
              </h2>
              {day.description && <p className="mt-1 text-tinta-soft">{day.description}</p>}
              {day.stops.length ? (
                <ol className="mt-4 space-y-4 border-l-2 border-dashed border-atlantico/30 pl-5">
                  {day.stops.map((s) => (
                    <li key={s.id} className="relative">
                      <span
                        className="absolute top-1.5 -left-[27px] h-3 w-3 rounded-full bg-atlantico ring-4 ring-white"
                        aria-hidden="true"
                      />
                      <p className="flex flex-wrap items-baseline gap-x-2">
                        {s.start_time && (
                          <span className="inline-flex items-center gap-1 text-sm font-bold text-atlantico tabular-nums">
                            <Clock aria-hidden="true" className="h-3.5 w-3.5" />
                            {s.start_time.slice(0, 5)}
                          </span>
                        )}
                        {s.place ? (
                          <Link
                            href={`/lugares/${s.place.slug}`}
                            className="font-bold underline decoration-linha underline-offset-4 hover:decoration-atlantico"
                          >
                            {s.place.name}
                          </Link>
                        ) : (
                          <span className="font-bold">{s.custom_name}</span>
                        )}
                        {s.place && (
                          <span className="text-xs text-tinta-soft">
                            {placeTypeLabels[s.place.type]}
                          </span>
                        )}
                      </p>
                      {s.notes && <p className="mt-0.5 text-sm text-tinta-soft">{s.notes}</p>}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="mt-3 text-sm text-tinta-soft">Dia livre.</p>
              )}
            </li>
          ))}
        </ol>
      )}
    </Container>
  );
}
