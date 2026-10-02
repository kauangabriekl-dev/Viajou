import Link from "next/link";
import { BestMonthsChart } from "@/components/destinations/BestMonthsChart";
import { DestinationReviewForm, TipForm } from "@/components/destinations/DestinationForms";
import { DeleteDestinationReview, TipActions } from "@/components/destinations/TipActions";
import { SectionHeading } from "@/components/home/SectionHeading";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { RatingStars } from "@/components/ui/RatingStars";
import { Tabs } from "@/components/ui/Tabs";
import { monthLong, monthShort, tipTopicLabel, tipTopics } from "@/lib/labels";
import type { DestinationInsights as Insights, TipTopic } from "@/types/database";
import { formatCents, formatRelativeDate, pluralize } from "@/utils/format";

type Props = {
  insights: Insights;
  destination: { id: string; name: string; slug: string };
  viewerId: string | null;
  activeTopic: TipTopic | "todas";
};

/**
 * "O que os viajantes dizem": nota do destino, melhor época, gasto por dia e dicas por assunto.
 * Só mostra números quando existem avaliações: sem dados, mostra um convite, nunca "0,0".
 */
export function DestinationInsights({ insights, destination, viewerId, activeTopic }: Props) {
  const { reviews, tips, ratingAvg, reviewsCount, monthVotes, dailyCost } = insights;
  const signedIn = Boolean(viewerId);
  const basePath = `/destinos/${destination.slug}`;
  const visibleTips = activeTopic === "todas" ? tips : tips.filter((t) => t.topic === activeTopic);
  const countByTopic = (topic: string) => tips.filter((t) => t.topic === topic).length;
  const loginHref = `/login?next=${encodeURIComponent(basePath)}`;

  return (
    <section aria-labelledby="dizem-title" id="dicas" className="scroll-mt-24 space-y-8">
      <SectionHeading
        id="dizem-title"
        eyebrow="Notas e dicas"
        lead="O que os viajantes"
        title="dizem"
        description={`Nota geral, melhor época, quanto se gasta e dicas de quem já foi a ${destination.name}.`}
      />

      <Link
        href={`/vou-viajar?destino=${destination.id}`}
        className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-card)] bg-petroleo px-6 py-5 text-white hover:bg-petroleo-900"
      >
        <span>
          <span className="block text-lg font-semibold">
            Monte seu roteiro para {destination.name}
          </span>
          <span className="block text-sm font-light text-white/85">
            Com os lugares mais bem avaliados pela comunidade, no seu ritmo e do seu jeito.
          </span>
        </span>
        <span className="rounded-full bg-agua px-5 py-2.5 text-sm font-semibold text-tinta">
          Vou viajar
        </span>
      </Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="space-y-6 rounded-[var(--radius-card)] bg-white p-6 ring-1 ring-linha">
          {ratingAvg !== null ? (
            <div className="flex items-end gap-4">
              <p className="text-5xl font-bold tracking-tight text-petroleo">
                {ratingAvg.toFixed(1).replace(".", ",")}
              </p>
              <div className="space-y-1 pb-1">
                <RatingStars value={ratingAvg} size={18} />
                <p className="text-sm text-tinta-soft">
                  {pluralize(reviewsCount, "avaliação", "avaliações")} do destino
                </p>
              </div>
            </div>
          ) : (
            <p className="text-tinta-soft">
              Ninguém avaliou {destination.name} ainda. Já esteve lá? Sua nota ajuda quem vai
              depois.
            </p>
          )}
          <BestMonthsChart votes={monthVotes} />
          {dailyCost && (
            <div>
              <p className="text-sm font-semibold text-tinta">Gasto por dia, por pessoa</p>
              <p className="text-2xl font-bold text-petroleo">
                {formatCents(dailyCost.medianCents)}
              </p>
              <p className="text-xs text-tinta-soft">
                Mediana de {pluralize(dailyCost.from, "relato", "relatos")}.
              </p>
            </div>
          )}

          {!signedIn ? (
            <Link
              href={loginHref}
              className="inline-flex min-h-11 items-center rounded-full bg-petroleo px-5 text-sm font-semibold text-white hover:bg-petroleo-900"
            >
              Entre para avaliar {destination.name}
            </Link>
          ) : insights.viewerReviewed ? (
            <p className="rounded-xl bg-petroleo-100 px-4 py-3 text-sm text-petroleo">
              Você já avaliou {destination.name}. Obrigado!
            </p>
          ) : (
            <details className="group rounded-2xl border border-linha p-4 open:bg-espuma">
              <summary className="flex min-h-11 cursor-pointer list-none items-center font-semibold text-petroleo [&::-webkit-details-marker]:hidden">
                Avaliar {destination.name}
              </summary>
              <div className="pt-4">
                <DestinationReviewForm
                  destinationId={destination.id}
                  destinationName={destination.name}
                />
              </div>
            </details>
          )}
        </div>

        <div className="space-y-4">
          <Tabs
            label="Assuntos das dicas"
            basePath={basePath}
            active={activeTopic}
            tabs={[
              { key: "todas", label: "Todas", count: tips.length },
              ...tipTopics.map((t) => ({
                key: t.value,
                label: t.label,
                count: countByTopic(t.value),
              })),
            ]}
          />
          {visibleTips.length ? (
            <ul className="space-y-3">
              {visibleTips.map((tip) => (
                <li key={tip.id} className="space-y-2 rounded-2xl bg-white p-5 ring-1 ring-linha">
                  <p className="text-xs font-semibold tracking-wider text-agua-700 uppercase">
                    {tipTopicLabel(tip.topic)}
                  </p>
                  <h3 className="font-semibold text-tinta">{tip.title}</h3>
                  <p className="text-sm font-light whitespace-pre-line text-tinta">{tip.body}</p>
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <Link
                      href={`/perfil/${tip.author.username}`}
                      className="flex items-center gap-2 text-xs text-tinta-soft hover:text-tinta"
                    >
                      <Avatar name={tip.author.full_name} src={tip.author.avatar_url} size="sm" />
                      {tip.author.full_name} · {formatRelativeDate(tip.created_at)}
                    </Link>
                    <TipActions
                      tipId={tip.id}
                      votes={tip.votes}
                      voted={insights.viewerVotedTipIds.includes(tip.id)}
                      isOwner={tip.user_id === viewerId}
                      signedIn={signedIn}
                    />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title={
                activeTopic === "todas"
                  ? "Nenhuma dica ainda."
                  : `Nenhuma dica de ${tipTopicLabel(activeTopic).toLowerCase()} ainda.`
              }
              description="Seja a primeira pessoa a contar."
            />
          )}

          {signedIn ? (
            <details className="rounded-2xl border border-linha bg-white p-4 open:pb-6">
              <summary className="flex min-h-11 cursor-pointer list-none items-center font-semibold text-petroleo [&::-webkit-details-marker]:hidden">
                Dar uma dica
              </summary>
              <div className="pt-4">
                <TipForm
                  destinationId={destination.id}
                  destinationName={destination.name}
                  defaultTopic={activeTopic === "todas" ? undefined : activeTopic}
                />
              </div>
            </details>
          ) : (
            <Link
              href={loginHref}
              className="inline-flex min-h-11 items-center font-semibold text-petroleo underline"
            >
              Entre para dar uma dica
            </Link>
          )}
        </div>
      </div>

      {reviews.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-petroleo">Avaliações do destino</h3>
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {reviews.slice(0, 10).map((r) => (
              <li key={r.id} className="space-y-3 rounded-2xl bg-white p-5 ring-1 ring-linha">
                <div className="flex items-start justify-between gap-3">
                  <Link href={`/perfil/${r.author.username}`} className="flex items-center gap-2">
                    <Avatar name={r.author.full_name} src={r.author.avatar_url} size="sm" />
                    <span>
                      <span className="block text-sm font-semibold text-tinta">
                        {r.author.full_name}
                      </span>
                      <span className="block text-xs text-tinta-soft">
                        {r.visited_month
                          ? `Foi em ${monthLong[r.visited_month - 1]}${r.visited_year ? ` de ${r.visited_year}` : ""}`
                          : formatRelativeDate(r.created_at)}
                      </span>
                    </span>
                  </Link>
                  <RatingStars value={r.rating} size={14} />
                </div>
                <p className="text-sm font-light whitespace-pre-line text-tinta">{r.body}</p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-tinta-soft">
                  {r.best_months.length > 0 && (
                    <span>Recomenda: {r.best_months.map((m) => monthShort[m - 1]).join(", ")}</span>
                  )}
                  {r.daily_cost_cents !== null && (
                    <span>· {formatCents(r.daily_cost_cents)} por dia</span>
                  )}
                  {r.user_id === viewerId && <DeleteDestinationReview reviewId={r.id} />}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
