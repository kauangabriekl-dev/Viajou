import Link from "next/link";
import { notFound } from "next/navigation";
import { ComplaintForm } from "@/components/places/ComplaintForm";
import { SetupNotice } from "@/components/ui/SetupNotice";
import { requireSession } from "@/lib/auth";
import { getPlace } from "@/lib/queries";
import { buildMetadata } from "@/lib/seo";
import { createClientIfConfigured } from "@/lib/supabase/server";

export const metadata = {
  ...buildMetadata({ title: "Registrar reclamação" }),
  robots: { index: false },
};

export default async function ComplaintPage({ params }: PageProps<"/lugares/[slug]/reclamar">) {
  const { slug } = await params;
  if (!(await createClientIfConfigured())) return <SetupNotice what="as reclamações" />;
  const { supabase } = await requireSession(`/lugares/${slug}/reclamar`);
  const place = await getPlace(supabase, slug);
  if (!place) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
      <Link
        href={`/lugares/${place.slug}`}
        className="text-sm font-semibold text-atlantico underline"
      >
        Voltar para {place.name}
      </Link>
      <h1 className="mt-3 mb-2 text-3xl font-extrabold tracking-tight">Registrar reclamação</h1>
      <p className="mb-8 text-tinta-soft">Sobre: {place.name}</p>
      <ComplaintForm placeId={place.id} />
    </div>
  );
}
