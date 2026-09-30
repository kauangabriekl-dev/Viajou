import type { ReactNode } from "react";
import { signInWithGoogle } from "@/lib/actions/auth";
import { googleAuthEnabled } from "@/lib/env";

export function AuthShell({
  title,
  description,
  children,
  next = "/",
}: {
  title: string;
  description: string;
  children: ReactNode;
  next?: string;
}) {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-12 sm:py-16">
      <div className="space-y-6 rounded-[2rem] bg-white p-6 ring-1 ring-linha sm:p-8">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
          <p className="text-tinta-soft">{description}</p>
        </div>
        {googleAuthEnabled && (
          <>
            <form action={signInWithGoogle}>
              <input type="hidden" name="next" value={next} />
              <button
                type="submit"
                className="w-full rounded-full border border-linha px-5 py-3 font-semibold hover:bg-espuma"
              >
                Continuar com Google
              </button>
            </form>
            <p className="text-center text-xs text-tinta-soft">ou com e-mail</p>
          </>
        )}
        {children}
      </div>
    </div>
  );
}
