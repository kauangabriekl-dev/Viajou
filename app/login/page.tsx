import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { SignInForm } from "@/components/auth/AuthForms";
import { getSession, safeNext } from "@/lib/auth";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Entrar",
  description: "Acesse sua conta VIAJOU.",
  path: "/login",
});

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = safeNext(typeof params.next === "string" ? params.next : "/");
  if (await getSession()) redirect(next);
  return (
    <AuthShell title="Entrar" description="Bom te ver de novo.">
      {params.erro && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
          Não foi possível entrar. Tente de novo.
        </p>
      )}
      <SignInForm next={next} />
    </AuthShell>
  );
}
