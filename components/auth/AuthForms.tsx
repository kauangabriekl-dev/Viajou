"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Field, describedBy, inputClass } from "@/components/forms/Field";
import { FormMessage, errorsFor } from "@/components/forms/FormMessage";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { signIn, signUp } from "@/lib/actions/auth";

export function SignInForm({ next }: { next: string }) {
  const [state, action] = useActionState(signIn, null);
  const emailErr = errorsFor(state, "email");
  const passErr = errorsFor(state, "password");
  return (
    <form action={action} className="space-y-5" noValidate>
      <input type="hidden" name="next" value={next} />
      <Field id="email" label="E-mail" errors={emailErr}>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          aria-invalid={emailErr ? true : undefined}
          aria-describedby={describedBy("email", emailErr)}
          className={inputClass}
        />
      </Field>
      <Field id="password" label="Senha" errors={passErr}>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={passErr ? true : undefined}
          aria-describedby={describedBy("password", passErr)}
          className={inputClass}
        />
      </Field>
      <FormMessage state={state} />
      <SubmitButton pendingLabel="Entrando…" className="w-full">
        Entrar
      </SubmitButton>
      <p className="text-center text-sm text-tinta-soft">
        Ainda não tem conta?{" "}
        <Link href="/cadastro" className="font-semibold text-petroleo underline">
          Criar conta
        </Link>
      </p>
    </form>
  );
}

export function SignUpForm() {
  const [state, action] = useActionState(signUp, null);
  if (state?.ok) return <FormMessage state={state} />;
  const e = (f: string) => errorsFor(state, f);
  return (
    <form action={action} className="space-y-5" noValidate>
      <Field id="fullName" label="Nome" errors={e("fullName")}>
        <input
          id="fullName"
          name="fullName"
          autoComplete="name"
          required
          maxLength={80}
          aria-invalid={e("fullName") ? true : undefined}
          aria-describedby={describedBy("fullName", e("fullName"))}
          className={inputClass}
        />
      </Field>
      <Field
        id="username"
        label="Username"
        hint="Seu endereço público: viajou/perfil/username. Letras minúsculas, números e _."
        errors={e("username")}
      >
        <div className="flex items-center rounded-xl border border-linha bg-white focus-within:border-petroleo focus-within:ring-2 focus-within:ring-petroleo/20">
          <span className="pl-3.5 text-tinta-soft" aria-hidden="true">
            @
          </span>
          <input
            id="username"
            name="username"
            autoComplete="username"
            required
            minLength={3}
            maxLength={30}
            pattern="[a-z0-9_]{3,30}"
            autoCapitalize="none"
            spellCheck={false}
            aria-invalid={e("username") ? true : undefined}
            aria-describedby={describedBy("username", e("username"), "hint")}
            className="w-full rounded-xl bg-transparent px-1.5 py-2.5 focus:outline-none"
          />
        </div>
      </Field>
      <Field id="email" label="E-mail" errors={e("email")}>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          aria-invalid={e("email") ? true : undefined}
          aria-describedby={describedBy("email", e("email"))}
          className={inputClass}
        />
      </Field>
      <Field id="password" label="Senha" hint="Mínimo de 8 caracteres." errors={e("password")}>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          aria-invalid={e("password") ? true : undefined}
          aria-describedby={describedBy("password", e("password"), "hint")}
          className={inputClass}
        />
      </Field>
      <FormMessage state={state} />
      <SubmitButton pendingLabel="Criando conta…" className="w-full">
        Criar conta
      </SubmitButton>
      <p className="text-center text-sm text-tinta-soft">
        Já tem conta?{" "}
        <Link href="/login" className="font-semibold text-petroleo underline">
          Entrar
        </Link>
      </p>
    </form>
  );
}
