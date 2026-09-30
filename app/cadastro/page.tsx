import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { SignUpForm } from "@/components/auth/AuthForms";
import { getSession } from "@/lib/auth";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Criar conta",
  description: "Crie sua conta e compartilhe experiências reais de viagem.",
  path: "/cadastro",
});

export default async function SignUpPage() {
  if (await getSession()) redirect("/minha-conta");
  return (
    <AuthShell title="Criar conta" description="Compartilhe suas viagens e ajude quem vai depois.">
      <SignUpForm />
    </AuthShell>
  );
}
