import Link from "next/link";
import { notFound } from "next/navigation";
import { ModerationActions } from "@/components/moderation/ModerationActions";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireSession } from "@/lib/auth";
import { reportReasonLabels, reportTargetLabels } from "@/lib/labels";
import { HIDE_AFTER_REPORTS, isAdmin, listModerationQueue } from "@/lib/moderation";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({ title: "Moderação", path: "/moderacao", noIndex: true });

export default async function ModerationPage() {
  const session = await requireSession("/moderacao");
  // Para quem não é administrador, a página simplesmente não existe.
  if (!(await isAdmin(session.userId))) notFound();
  const queue = await listModerationQueue();

  return (
    <Container className="max-w-4xl pb-16">
      <PageHeader
        title="Moderação"
        description={`Lugares e achadinhos denunciados. Com ${HIDE_AFTER_REPORTS} denúncias, o conteúdo da comunidade sai do ar até você decidir.`}
      />
      {queue.length ? (
        <ul className="space-y-4">
          {queue.map((item) => (
            <li
              key={`${item.type}-${item.id}`}
              className="rounded-2xl border border-linha bg-white p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <p className="text-xs font-semibold tracking-wide text-tinta-soft uppercase">
                    {reportTargetLabels[item.type]}
                    {item.hidden && (
                      <span className="ml-2 rounded-full bg-red-50 px-2 py-0.5 text-red-700">
                        Fora do ar
                      </span>
                    )}
                  </p>
                  <p className="font-semibold">
                    {item.hidden ? (
                      item.name
                    ) : (
                      <Link href={item.href} className="hover:underline">
                        {item.name}
                      </Link>
                    )}
                  </p>
                  <p className="text-sm text-tinta-soft">
                    {item.reports} {item.reports === 1 ? "denúncia aberta" : "denúncias abertas"}
                    {item.reasons.length > 0 &&
                      ` · ${item.reasons.map((r) => reportReasonLabels[r as keyof typeof reportReasonLabels] ?? r).join(", ")}`}
                  </p>
                  {item.details.length > 0 && (
                    <ul className="list-disc pl-5 text-sm text-tinta-soft">
                      {item.details.slice(0, 3).map((d, i) => (
                        <li key={i}>{d}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <ModerationActions type={item.type} id={item.id} name={item.name} />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          title="Nada para revisar."
          description="Quando alguém denunciar um lugar ou achadinho, ele aparece aqui."
        />
      )}
    </Container>
  );
}
