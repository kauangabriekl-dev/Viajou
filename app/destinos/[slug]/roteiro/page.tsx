import { notFound, permanentRedirect } from "next/navigation";
import { getDestination } from "@/lib/queries";

/**
 * O roteiro do destino agora é montado no Vou viajar, com o destino já escolhido:
 * lá ele considera as datas, o ritmo e o que a pessoa conta sobre ela.
 */
export default async function DestinationItineraryRedirect({
  params,
}: PageProps<"/destinos/[slug]/roteiro">) {
  const destination = await getDestination((await params).slug);
  if (!destination) notFound();
  permanentRedirect(`/vou-viajar?destino=${destination.id}`);
}
