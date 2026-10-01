import Link from "next/link";
import { ProfileForm } from "@/components/account/ProfileForm";
import { requireSession } from "@/lib/auth";
import { signOut } from "@/lib/actions/auth";
import { buildMetadata } from "@/lib/seo";

export const metadata = { ...buildMetadata({ title: "Configurações" }), robots: { index: false } };

export default async function SettingsPage() {
  const { profile, email } = await requireSession("/configuracoes");
  return (
    <div className="mx-auto max-w-xl space-y-10 px-4 py-10 sm:py-14">
      <div>
        <Link
          href={`/perfil/${profile.username}`}
          className="text-sm font-semibold text-petroleo underline"
        >
          Ver meu perfil
        </Link>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Configurações</h1>
      </div>
      <section
        aria-labelledby="perfil-title"
        className="space-y-6 rounded-[var(--radius-card)] bg-white p-6 ring-1 ring-linha"
      >
        <h2 id="perfil-title" className="text-xl font-extrabold">
          Perfil
        </h2>
        <ProfileForm profile={profile} />
      </section>
      <section
        aria-labelledby="conta-title"
        className="space-y-3 rounded-[var(--radius-card)] bg-white p-6 ring-1 ring-linha"
      >
        <h2 id="conta-title" className="text-xl font-extrabold">
          Conta
        </h2>
        <p className="text-sm text-tinta-soft">E-mail: {email}</p>
        <form action={signOut}>
          <button
            type="submit"
            className="rounded-full border border-linha px-5 py-2 text-sm font-bold hover:bg-espuma"
          >
            Sair da conta
          </button>
        </form>
      </section>
    </div>
  );
}
