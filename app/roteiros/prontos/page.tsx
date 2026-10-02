import { permanentRedirect } from "next/navigation";

/** Os roteiros prontos agora ficam na vitrine única de /roteiros (filtro "Equipe Viajou"). */
export default async function ReadyItinerariesRedirect({
  searchParams,
}: PageProps<"/roteiros/prontos">) {
  const params = await searchParams;
  const qs = new URLSearchParams({ origem: "equipe" });
  if (typeof params.dias === "string") qs.set("dias", params.dias);
  permanentRedirect(`/roteiros?${qs}`);
}
