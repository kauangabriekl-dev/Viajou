import { ItineraryBuilder } from "@/components/itineraries/ItineraryBuilder";
import { requireSession } from "@/lib/auth";
import { listDestinationOptions, listPlaceOptions } from "@/lib/queries";
import { buildMetadata } from "@/lib/seo";

export const metadata = {
  ...buildMetadata({ title: "Criar roteiro", path: "/criar/roteiro" }),
  robots: { index: false },
};

export default async function CreateItineraryPage() {
  await requireSession("/criar/roteiro");
  const [destinations, places] = await Promise.all([listDestinationOptions(), listPlaceOptions()]);
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <h1 className="mb-2 text-3xl font-extrabold tracking-tight">Criar roteiro</h1>
      <p className="mb-8 text-tinta-soft">
        Monte dia a dia. Você pode escolher lugares cadastrados ou escrever livremente.
      </p>
      <ItineraryBuilder destinations={destinations} places={places} />
    </div>
  );
}
