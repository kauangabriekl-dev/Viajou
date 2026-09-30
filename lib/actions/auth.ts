"use server";

import { redirect } from "next/navigation";
import { safeNext } from "@/lib/auth";
import { publicEnv } from "@/lib/env";
import { friendlyError, type ActionResult } from "@/lib/errors";
import { createClientIfConfigured } from "@/lib/supabase/server";
import { fieldErrors, signInSchema, signUpSchema } from "@/lib/validation";

const NOT_CONFIGURED: ActionResult = {
  ok: false,
  error: "O login ainda não está disponível: o Supabase não foi configurado.",
};

export async function signUp(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = signUpSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    return {
      ok: false,
      error: "Revise os campos destacados.",
      fieldErrors: fieldErrors(parsed.error),
    };

  const supabase = await createClientIfConfigured();
  if (!supabase) return NOT_CONFIGURED;

  const { fullName, username, email, password } = parsed.data;

  const { data: taken } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();
  if (taken) {
    return {
      ok: false,
      error: "Revise os campos destacados.",
      fieldErrors: { username: ["Este username já está em uso."] },
    };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username, full_name: fullName },
      emailRedirectTo: `${publicEnv.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/minha-conta`,
    },
  });
  if (error) return { ok: false, error: friendlyError(error, "signUp") };

  if (!data.session) {
    return {
      ok: true,
      message: "Conta criada. Enviamos um link de confirmação para o seu e-mail.",
    };
  }
  redirect("/minha-conta");
}

export async function signIn(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = signInSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    return {
      ok: false,
      error: "Revise os campos destacados.",
      fieldErrors: fieldErrors(parsed.error),
    };

  const supabase = await createClientIfConfigured();
  if (!supabase) return NOT_CONFIGURED;

  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { ok: false, error: friendlyError(error, "signIn") };

  redirect(safeNext(formData.get("next")));
}

/** Google OAuth: habilite o provedor no Supabase e defina NEXT_PUBLIC_ENABLE_GOOGLE_AUTH=true. */
export async function signInWithGoogle(formData: FormData) {
  const supabase = await createClientIfConfigured();
  if (!supabase) redirect("/login");
  const next = safeNext(formData.get("next"));
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${publicEnv.NEXT_PUBLIC_SITE_URL}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });
  if (error || !data.url) redirect("/login?erro=oauth");
  redirect(data.url);
}

export async function signOut() {
  const supabase = await createClientIfConfigured();
  if (supabase) await supabase.auth.signOut();
  redirect("/");
}
