import Link from "next/link";
import { ComplaintActions } from "@/components/account/ComplaintActions";
import { ComplaintCard } from "@/components/cards/ComplaintCard";
import { ItineraryCard } from "@/components/cards/ItineraryCard";
import { PostCard } from "@/components/cards/PostCard";
import { Avatar } from "@/components/ui/Avatar";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { SetupNotice } from "@/components/ui/SetupNotice";
import { Tabs } from "@/components/ui/Tabs";
import { requireSession } from "@/lib/auth";
import { markNotificationsRead } from "@/lib/actions/social";
import { notificationLabels, tagLabel } from "@/lib/labels";
import {
  listComplaints,
  listFollowingIds,
  listItineraries,
  listNotifications,
  listPosts,
  listSavedItineraryIds,
  listSavedPostIds,
  listTripPlans,
} from "@/lib/queries";
import { buildMetadata } from "@/lib/seo";
import { createClientIfConfigured } from "@/lib/supabase/server";
import type { Complaint, Itinerary, Notification, Post } from "@/types/database";
import type { TripPlanRow } from "@/lib/queries";
import { formatCents, formatDateRange, formatRelativeDate, pluralize } from "@/utils/format";

export const metadata = { ...buildMetadata({ title: "Minha conta" }), robots: { index: false } };

const TABS = ["feed", "salvos", "roteiros", "notificacoes", "reclamacoes", "viagens"] as const;
type Tab = (typeof TABS)[number];

function notificationHref(n: Notification) {
  if (n.post_id) return `/viagens/${n.post_id}`;
  if (n.itinerary_id) return `/roteiros/${n.itinerary_id}`;
  if (n.complaint_id) return "/minha-conta?aba=reclamacoes";
  return n.actor ? `/perfil/${n.actor.username}` : "#";
}

export default async function AccountPage({ searchParams }: PageProps<"/minha-conta">) {
  if (!(await createClientIfConfigured())) return <SetupNotice what="sua conta" />;
  const { supabase, userId, profile } = await requireSession("/minha-conta");
  const query = await searchParams;
  const tab: Tab = TABS.includes(query.aba as Tab) ? (query.aba as Tab) : "feed";

  type TabData = {
    posts?: Post[];
    itineraries?: Itinerary[];
    notifications?: Notification[];
    complaints?: Complaint[];
    plans?: TripPlanRow[];
    following?: number;
  };
  async function loadTab(): Promise<TabData> {
    switch (tab) {
      case "feed": {
        const ids = await listFollowingIds(supabase, userId);
        return {
          posts: ids.length ? await listPosts(supabase, { userIds: ids, limit: 30 }) : [],
          following: ids.length,
        };
      }
      case "salvos": {
        const [postIds, itineraryIds] = await Promise.all([
          listSavedPostIds(supabase, userId),
          listSavedItineraryIds(supabase, userId),
        ]);
        const [posts, itineraries] = await Promise.all([
          postIds.length ? listPosts(supabase, { ids: postIds, limit: 100 }) : [],
          itineraryIds.length ? listItineraries(supabase, { ids: itineraryIds, limit: 100 }) : [],
        ]);
        return { posts, itineraries };
      }
      case "roteiros":
        return { itineraries: await listItineraries(supabase, { userId, limit: 100 }) };
      case "notificacoes":
        return { notifications: await listNotifications(supabase, userId) };
      case "reclamacoes":
        return { complaints: await listComplaints(supabase, { userId, limit: 50 }) };
      case "viagens":
        return { plans: await listTripPlans(supabase, userId) };
    }
  }
  const data = await loadTab();
  const unread = data.notifications?.filter((n) => !n.read_at).length ?? 0;

  return (
    <Container className="space-y-8 py-8 sm:py-12">
      <header className="flex flex-wrap items-center gap-4">
        <Avatar name={profile.full_name} src={profile.avatar_url} size="lg" />
        <div className="flex-1">
          <h1 className="text-3xl font-extrabold tracking-tight">
            Olá, {profile.full_name.split(" ")[0]}
          </h1>
          <p className="text-tinta-soft">@{profile.username}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/perfil/${profile.username}`}
            className="rounded-full bg-white px-4 py-2 text-sm font-bold ring-1 ring-linha"
          >
            Ver perfil
          </Link>
          <Link
            href="/configuracoes"
            className="rounded-full bg-white px-4 py-2 text-sm font-bold ring-1 ring-linha"
          >
            Configurações
          </Link>
        </div>
      </header>

      <Tabs
        label="Minha conta"
        basePath="/minha-conta"
        active={tab}
        tabs={[
          { key: "feed", label: "Seguindo" },
          { key: "salvos", label: "Salvos" },
          { key: "roteiros", label: "Meus roteiros" },
          { key: "notificacoes", label: "Notificações" },
          { key: "reclamacoes", label: "Reclamações" },
          { key: "viagens", label: "Próximas viagens" },
        ]}
      />

      {tab === "feed" &&
        (data.posts?.length ? (
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data.posts.map((p) => (
              <li key={p.id} className="flex">
                <PostCard post={p} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title={
              data.following
                ? "As pessoas que você segue ainda não publicaram."
                : "Você ainda não segue ninguém."
            }
            description="Siga viajantes para ver as publicações deles aqui."
            action={{ href: "/explorar", label: "Explorar" }}
          />
        ))}

      {tab === "salvos" && (
        <div className="space-y-10">
          <section aria-labelledby="salvos-posts" className="space-y-4">
            <h2 id="salvos-posts" className="text-xl font-extrabold">
              Publicações salvas
            </h2>
            {data.posts?.length ? (
              <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {data.posts.map((p) => (
                  <li key={p.id} className="flex">
                    <PostCard post={p} />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                title="Nenhuma publicação salva."
                description="Toque em Salvar em uma publicação para guardá-la aqui."
              />
            )}
          </section>
          <section aria-labelledby="salvos-roteiros" className="space-y-4">
            <h2 id="salvos-roteiros" className="text-xl font-extrabold">
              Roteiros salvos
            </h2>
            {data.itineraries?.length ? (
              <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {data.itineraries.map((i) => (
                  <li key={i.id}>
                    <ItineraryCard itinerary={i} />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="Nenhum roteiro salvo." />
            )}
          </section>
        </div>
      )}

      {tab === "roteiros" &&
        (data.itineraries?.length ? (
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data.itineraries.map((i) => (
              <li key={i.id}>
                <ItineraryCard itinerary={i} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="Você ainda não criou roteiros."
            action={{ href: "/criar/roteiro", label: "Criar roteiro" }}
          />
        ))}

      {tab === "notificacoes" && (
        <section className="max-w-2xl space-y-4" aria-label="Notificações">
          {unread > 0 && (
            <form action={markNotificationsRead}>
              <button type="submit" className="text-sm font-semibold text-atlantico underline">
                Marcar todas como lidas ({unread})
              </button>
            </form>
          )}
          {data.notifications?.length ? (
            <ul className="divide-y divide-linha overflow-hidden rounded-[var(--radius-card)] bg-white ring-1 ring-linha">
              {data.notifications.map((n) => (
                <li key={n.id}>
                  <Link
                    href={notificationHref(n)}
                    className={`flex items-center gap-3 px-4 py-3 hover:bg-espuma ${n.read_at ? "" : "bg-atlantico-100/40"}`}
                  >
                    <Avatar
                      name={n.actor?.full_name ?? "VIAJOU"}
                      src={n.actor?.avatar_url}
                      size="sm"
                    />
                    <p className="flex-1 text-sm">
                      <span className="font-bold">{n.actor?.full_name ?? "Alguém"}</span>{" "}
                      {notificationLabels[n.type]}
                      {!n.read_at && <span className="sr-only"> (não lida)</span>}
                    </p>
                    <time dateTime={n.created_at} className="text-xs text-tinta-soft">
                      {formatRelativeDate(n.created_at)}
                    </time>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="Nenhuma notificação."
              description="Curtidas, comentários e novos seguidores aparecem aqui."
            />
          )}
        </section>
      )}

      {tab === "reclamacoes" && (
        <section className="max-w-3xl space-y-4" aria-label="Minhas reclamações">
          {data.complaints?.length ? (
            data.complaints.map((c) => (
              <ComplaintCard key={c.id} complaint={c} showPlace>
                {(c.status === "pending" || c.status === "answered") && (
                  <ComplaintActions id={c.id} />
                )}
              </ComplaintCard>
            ))
          ) : (
            <EmptyState
              title="Você não registrou reclamações."
              description="Para registrar, abra a página do lugar e toque em Registrar reclamação."
            />
          )}
        </section>
      )}

      {tab === "viagens" &&
        (data.plans?.length ? (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {data.plans.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/vou-viajar?plano=${p.id}`}
                  className="block space-y-1 rounded-[var(--radius-card)] bg-white p-5 ring-1 ring-linha hover:ring-atlantico"
                >
                  <p className="text-lg font-extrabold">{p.destination.name}</p>
                  <p className="text-sm text-tinta-soft">
                    {formatDateRange(p.start_date, p.end_date)} ·{" "}
                    {pluralize(p.travelers, "pessoa", "pessoas")}
                    {p.budget_cents !== null && ` · até ${formatCents(p.budget_cents)}`}
                  </p>
                  {p.preferences.length > 0 && (
                    <p className="text-xs text-atlantico">
                      {p.preferences.map(tagLabel).join(", ")}
                    </p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="Nenhuma viagem planejada."
            action={{ href: "/vou-viajar", label: "Planejar uma viagem" }}
          />
        ))}
    </Container>
  );
}
