import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileNav } from "@/components/layout/NavLinks";
import { getSession } from "@/lib/auth";
import { buildMetadata, siteConfig } from "@/lib/seo";

/** Poppins: a mesma família geométrica das referências. Baixada no build e servida pelo próprio site. */
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  ...buildMetadata({}),
};

export const viewport: Viewport = {
  themeColor: "#1e5b74",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const session = await getSession();
  return (
    <html lang="pt-BR" className={`h-full antialiased ${poppins.variable}`}>
      <body className="flex min-h-full flex-col">
        <a
          href="#conteudo"
          className="sr-only z-50 rounded-md bg-white px-4 py-2 font-semibold focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Pular para o conteúdo
        </a>
        <Header session={session} />
        <main id="conteudo" className="flex-1">
          {children}
        </main>
        <Footer />
        <MobileNav signedIn={Boolean(session)} />
      </body>
    </html>
  );
}
