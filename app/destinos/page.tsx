import { DestinationCard } from "@/components/cards/DestinationCard";
import { Container } from "@/components/ui/Container";
import { DemoBadge } from "@/components/ui/DemoBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SetupNotice } from "@/components/ui/SetupNotice";
import { listDestinations } from "@/lib/queries";
import { buildMetadata } from "@/lib/seo";
import { createClientIfConfigured } from "@/lib/supabase/server";

export const metadata = buildMetadata({
  title: "Destinos",
  description: "Destinos avaliados por viajantes, com fotos, lugares e roteiros.",
  path: "/destinos",
});

export default async function DestinationsPage() {
  const supabase = await createClientIfConfigured();
  if (!supabase) return <SetupNotice what="os destinos" />;
  const destinations = await listDestinations(supabase);

  return (
    <Container>
      <PageHeader title="Destinos" description="Para onde as pessoas estão indo e o que acharam." />
      {destinations.some((d) => d.is_demo) && (
        <div className="mb-6">
          <DemoBadge />
        </div>
      )}
      {destinations.length ? (
        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {destinations.map((d) => (
            <li key={d.id}>
              <DestinationCard destination={d} />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title="Nenhum destino cadastrado ainda." />
      )}
    </Container>
  );
}
