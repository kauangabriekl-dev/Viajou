import type { Metadata } from "next";
import { publicEnv } from "@/lib/env";

export const siteConfig = {
  name: "VIAJOU",
  description:
    "Experiências reais de quem já esteve lá. Avaliações, fotos e roteiros de viajantes.",
  url: publicEnv.NEXT_PUBLIC_SITE_URL,
  locale: "pt_BR",
};

/** Gera title, description, canonical e Open Graph de forma consistente para cada página. */
export function buildMetadata({
  title,
  description = siteConfig.description,
  path = "/",
  noIndex = false,
}: {
  title?: string;
  description?: string;
  path?: string;
  /** Páginas internas (moderação) ficam fora dos buscadores. */
  noIndex?: boolean;
}): Metadata {
  const fullTitle = title
    ? `${title} | ${siteConfig.name}`
    : `${siteConfig.name}: viaje sabendo onde ir`;
  return {
    title: fullTitle,
    description,
    alternates: { canonical: path },
    ...(noIndex ? { robots: { index: false, follow: false } } : {}),
    openGraph: {
      title: fullTitle,
      description,
      url: path,
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      type: "website",
    },
  };
}
