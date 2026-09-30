import { Container } from "@/components/ui/Container";

/** Mostrado quando o Supabase ainda não foi configurado: explica o que falta, sem erro técnico. */
export function SetupNotice({ what }: { what: string }) {
  return (
    <Container className="py-20">
      <div className="max-w-xl space-y-3 rounded-[var(--radius-card)] bg-white p-8 ring-1 ring-linha">
        <h1 className="text-2xl font-extrabold">Conecte o banco de dados para ver {what}</h1>
        <p className="text-tinta-soft">
          Este ambiente ainda não tem o Supabase configurado. Preencha{" "}
          <code className="rounded bg-espuma px-1">NEXT_PUBLIC_SUPABASE_URL</code> e{" "}
          <code className="rounded bg-espuma px-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> em{" "}
          <code className="rounded bg-espuma px-1">.env.local</code> e aplique as migrations. O
          passo a passo está no README.
        </p>
      </div>
    </Container>
  );
}
