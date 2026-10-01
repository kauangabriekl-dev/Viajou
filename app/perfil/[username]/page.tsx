import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ItineraryCard } from "@/components/cards/ItineraryCard";
import { PostCard } from "@/components/cards/PostCard";
import { ReviewCard } from "@/components/cards/ReviewCard";
import { FollowButton } from "@/components/social/Buttons";
import { ReportButton } from "@/components/social/ReportButton";
import { Avatar } from "@/components/ui/Avatar";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { Tabs } from "@/components/ui/Tabs";
import { getSession } from "@/lib/auth";
import {
  getProfileByUsername,
  getProfileStats,
  isFollowing,
  listItineraries,
  listPosts,
  listReviews,
  listUserPhotos,
} from "@/lib/queries";
import { buildMetadata } from "@/lib/seo";
import { photoUrl } from "@/lib/storage";

export async function generateMetadata({ params }: PageProps<"/perfil/[username]">) {
  const { username } = await params;
  const profile = await getProfileByUsername(username);
  if (!profile) return buildMetadata({ title: "Perfil", path: `/perfil/${username}` });
  return buildMetadata({
    title: `${profile.full_name} (@${profile.username})`,
    description: profile.bio ?? `Viagens, roteiros e avaliações de ${profile.full_name} no VIAJOU.`,
    path: `/perfil/${profile.username}`,
  });
}

const TABS = ["publicacoes", "roteiros", "avaliacoes", "fotos"] as const;
type Tab = (typeof TABS)[number];

export default async function ProfilePage({
  params,
  searchParams,
}: PageProps<"/perfil/[username]">) {
  const [{ username }, query] = await Promise.all([params, searchParams]);

  const profile = await getProfileByUsername(username);
  if (!profile) notFound();

  const session = await getSession();
  const isSelf = session?.userId === profile.id;
  const tab: Tab = TABS.includes(query.aba as Tab) ? (query.aba as Tab) : "publicacoes";

  const [stats, following, posts, itineraries, reviews, photos] = await Promise.all([
    getProfileStats(profile.id),
    isFollowing(session?.userId, profile.id),
    tab === "publicacoes" ? listPosts({ userId: profile.id, limit: 30 }) : Promise.resolve([]),
    tab === "roteiros"
      ? listItineraries({ userId: profile.id, limit: 30, viewerId: session?.userId })
      : Promise.resolve([]),
    tab === "avaliacoes" ? listReviews({ userId: profile.id, limit: 30 }) : Promise.resolve([]),
    tab === "fotos" ? listUserPhotos(profile.id) : Promise.resolve([]),
  ]);

  const statItems = [
    { label: stats.posts === 1 ? "publicação" : "publicações", value: stats.posts },
    { label: stats.reviews === 1 ? "avaliação" : "avaliações", value: stats.reviews },
    { label: stats.followers === 1 ? "seguidor" : "seguidores", value: stats.followers },
    { label: "seguindo", value: stats.following },
  ];

  return (
    <Container className="space-y-8 py-8 sm:py-12">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <Avatar name={profile.full_name} src={profile.avatar_url} size="lg" />
        <div className="flex-1 space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight">{profile.full_name}</h1>
          <p className="text-tinta-soft">@{profile.username}</p>
          {profile.bio && <p className="max-w-prose whitespace-pre-line">{profile.bio}</p>}
          <dl className="flex flex-wrap gap-x-6 gap-y-1 pt-1 text-sm">
            {statItems.map((s) => (
              <div key={s.label} className="flex gap-1">
                <dt className="sr-only">{s.label}</dt>
                <dd>
                  <span className="font-extrabold tabular-nums">{s.value}</span>{" "}
                  <span className="text-tinta-soft">{s.label}</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="flex items-center gap-2">
          {isSelf ? (
            <Link
              href="/configuracoes"
              className="rounded-full bg-white px-5 py-2 text-sm font-bold ring-1 ring-linha hover:ring-petroleo"
            >
              Editar perfil
            </Link>
          ) : (
            <>
              <FollowButton
                profileId={profile.id}
                initialActive={following}
                signedIn={Boolean(session)}
              />
              <ReportButton
                targetType="profile"
                targetId={profile.id}
                signedIn={Boolean(session)}
              />
            </>
          )}
        </div>
      </header>

      <Tabs
        label="Conteúdo do perfil"
        basePath={`/perfil/${profile.username}`}
        active={tab}
        tabs={[
          { key: "publicacoes", label: "Publicações", count: stats.posts },
          { key: "roteiros", label: "Roteiros" },
          { key: "avaliacoes", label: "Avaliações", count: stats.reviews },
          { key: "fotos", label: "Fotos" },
        ]}
      />

      {tab === "publicacoes" &&
        (posts.length ? (
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <li key={p.id} className="flex">
                <PostCard post={p} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="Nenhuma publicação ainda."
            action={isSelf ? { href: "/criar", label: "Publicar uma viagem" } : undefined}
          />
        ))}

      {tab === "roteiros" &&
        (itineraries.length ? (
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {itineraries.map((i) => (
              <li key={i.id}>
                <ItineraryCard itinerary={i} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="Nenhum roteiro público ainda."
            action={isSelf ? { href: "/criar/roteiro", label: "Criar roteiro" } : undefined}
          />
        ))}

      {tab === "avaliacoes" &&
        (reviews.length ? (
          <div className="max-w-3xl space-y-4">
            {reviews.map((r) => (
              <ReviewCard key={r.id} review={r} viewerId={session?.userId ?? null} showPlace />
            ))}
          </div>
        ) : (
          <EmptyState title="Nenhuma avaliação ainda." />
        ))}

      {tab === "fotos" &&
        (photos.length ? (
          <ul className="grid grid-cols-3 gap-1.5 sm:gap-3">
            {photos.map((p) => (
              <li key={p.id}>
                <Link href={`/viagens/${p.post_id}`}>
                  <Image
                    src={photoUrl(p.storage_path)}
                    alt={p.alt ?? "Foto de viagem"}
                    width={400}
                    height={400}
                    className="aspect-square w-full rounded-xl object-cover"
                  />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="Nenhuma foto ainda." />
        ))}
    </Container>
  );
}
