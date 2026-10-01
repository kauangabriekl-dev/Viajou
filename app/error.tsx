"use client";

import { useEffect } from "react";
import { Container } from "@/components/ui/Container";

/** Nunca mostra detalhes técnicos ao usuário; o log fica restrito ao ambiente de desenvolvimento. */
export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") console.error(error);
  }, [error]);

  return (
    <Container className="py-24">
      <div role="alert" className="max-w-lg space-y-4">
        <h1 className="text-3xl font-extrabold tracking-tight">
          Não foi possível carregar esta página.
        </h1>
        <p className="text-tinta-soft">Verifique sua conexão e tente de novo.</p>
        <button
          type="button"
          onClick={() => retry()}
          className="rounded-full bg-petroleo px-5 py-3 font-semibold text-white hover:bg-petroleo-900"
        >
          Tentar de novo
        </button>
      </div>
    </Container>
  );
}
