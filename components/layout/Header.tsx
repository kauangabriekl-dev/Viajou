import Link from "next/link";
import { Bell, CirclePlus, LogOut } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Container } from "@/components/ui/Container";
import { Logo } from "@/components/ui/Logo";
import { DesktopNav } from "@/components/layout/NavLinks";
import { signOut } from "@/lib/actions/auth";
import type { Session } from "@/lib/auth";
import { countUnreadNotifications } from "@/lib/queries";

export async function Header({ session }: { session: Session | null }) {
  const unread = session ? await countUnreadNotifications(session.supabase, session.userId) : 0;

  return (
    <header className="sticky top-0 z-40 border-b border-linha/70 bg-espuma/90 backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Logo />
        <DesktopNav />
        {session ? (
          <div className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/criar"
              className="hidden items-center gap-1.5 rounded-full bg-atlantico px-4 py-2 text-sm font-semibold text-white hover:bg-atlantico-900 sm:inline-flex"
            >
              <CirclePlus aria-hidden="true" className="h-4 w-4" />
              Publicar
            </Link>
            <Link
              href="/minha-conta?aba=notificacoes"
              className="relative rounded-full p-2 text-tinta hover:bg-white"
              aria-label={unread ? `Notificações: ${unread} não lidas` : "Notificações"}
            >
              <Bell aria-hidden="true" className="h-5 w-5" />
              {unread > 0 && (
                <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Link>
            <Link
              href={`/perfil/${session.profile.username}`}
              className="rounded-full"
              aria-label="Meu perfil"
            >
              <Avatar name={session.profile.full_name} src={session.profile.avatar_url} size="sm" />
            </Link>
            <form action={signOut} className="hidden sm:block">
              <button
                type="submit"
                className="rounded-full p-2 text-tinta-soft hover:bg-white hover:text-tinta"
                aria-label="Sair"
              >
                <LogOut aria-hidden="true" className="h-5 w-5" />
              </button>
            </form>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden rounded-full px-4 py-2 text-sm font-semibold text-tinta hover:bg-white sm:inline-flex"
            >
              Entrar
            </Link>
            <Link
              href="/cadastro"
              className="rounded-full bg-atlantico px-4 py-2 text-sm font-semibold text-white hover:bg-atlantico-900"
            >
              Criar conta
            </Link>
          </div>
        )}
      </Container>
    </header>
  );
}
