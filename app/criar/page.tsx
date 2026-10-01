import { PostForm } from "@/components/posts/PostForm";
import { requireSession } from "@/lib/auth";
import { listDestinationOptions, listPlaceOptions } from "@/lib/queries";
import { buildMetadata } from "@/lib/seo";

export const metadata = {
  ...buildMetadata({ title: "Publicar uma viagem", path: "/criar" }),
  robots: { index: false },
};

export default async function CreatePostPage({ searchParams }: PageProps<"/criar">) {
  await requireSession("/criar");
  const params = await searchParams;
  const [destinations, places] = await Promise.all([listDestinationOptions(), listPlaceOptions()]);
  const initial =
    typeof params.destino === "string" && destinations.some((d) => d.id === params.destino)
      ? params.destino
      : "";

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
      <h1 className="mb-2 text-3xl font-extrabold tracking-tight">Publicar uma viagem</h1>
      <p className="mb-8 text-tinta-soft">
        Conte o que valeu a pena, quanto custou e o que você faria diferente.
      </p>
      <PostForm destinations={destinations} places={places} initialDestinationId={initial} />
    </div>
  );
}
