"use server";

import { redirect } from "next/navigation";
import { endSession, safeNext, startSession } from "@/lib/auth";
import { exec, one, searchKey, tx } from "@/lib/db/client";
import { friendlyError, type ActionResult } from "@/lib/errors";
import { dummyPasswordHash, hashPassword, verifyPassword } from "@/lib/password";
import { clearLimit, clientIp, hitLimit, LIMITS } from "@/lib/rate-limit";
import { fieldErrors, signInSchema, signUpSchema } from "@/lib/validation";

const WRONG_LOGIN: ActionResult = { ok: false, error: "E-mail ou senha incorretos." };

const tooMany = (minutes: number): ActionResult => ({
  ok: false,
  error: `Muitas tentativas. Tente de novo em ${minutes} ${minutes === 1 ? "minuto" : "minutos"}.`,
});

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
  const { fullName, username, email, password } = parsed.data;

  const signupLimit = await hitLimit(`signup:ip:${await clientIp()}`, LIMITS.signupIp);
  if (!signupLimit.allowed) return tooMany(signupLimit.retryAfterMinutes);

  const [emailTaken, usernameTaken] = await Promise.all([
    one("SELECT id FROM users WHERE email = $1", [email]),
    one("SELECT id FROM profiles WHERE username = $1", [username]),
  ]);
  if (emailTaken || usernameTaken) {
    return {
      ok: false,
      error: "Revise os campos destacados.",
      fieldErrors: {
        ...(emailTaken ? { email: ["Já existe uma conta com este e-mail."] } : {}),
        ...(usernameTaken ? { username: ["Este username já está em uso."] } : {}),
      },
    };
  }

  const userId = crypto.randomUUID();
  const passwordHash = await hashPassword(password);
  try {
    // Conta e perfil nascem juntos, na mesma transação.
    await tx(async (client) => {
      await exec(
        "INSERT INTO users (id, email, password_hash) VALUES ($1, $2, $3)",
        [userId, email, passwordHash],
        client,
      );
      await exec(
        "INSERT INTO profiles (id, username, full_name, search_key) VALUES ($1, $2, $3, $4)",
        [userId, username, fullName, searchKey(username, fullName)],
        client,
      );
      await startSession(userId, client);
    });
  } catch (error) {
    // Corrida rara: outra pessoa pegou o mesmo e-mail ou username entre a checagem e o insert.
    if ((error as { code?: string }).code === "23505") {
      return { ok: false, error: "Este e-mail ou username acabou de ser usado. Tente outro." };
    }
    return { ok: false, error: friendlyError(error as Error, "signUp") };
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

  // Limite por IP (todas as contas) e por e-mail (protege uma conta específica).
  const emailBucket = `login:email:${parsed.data.email}`;
  const ipLimit = await hitLimit(`login:ip:${await clientIp()}`, LIMITS.loginIp);
  if (!ipLimit.allowed) return tooMany(ipLimit.retryAfterMinutes);
  const emailLimit = await hitLimit(emailBucket, LIMITS.loginEmail);
  if (!emailLimit.allowed) return tooMany(emailLimit.retryAfterMinutes);

  const user = await one<{ id: string; password_hash: string }>(
    "SELECT id, password_hash FROM users WHERE email = $1",
    [parsed.data.email],
  );
  // Sem usuário, compara com um hash qualquer: o tempo de resposta não revela quais e-mails existem.
  const valid = await verifyPassword(
    parsed.data.password,
    user?.password_hash ?? (await dummyPasswordHash()),
  );
  if (!user || !valid) return WRONG_LOGIN;
  await clearLimit(emailBucket);

  try {
    await startSession(user.id);
  } catch (error) {
    return { ok: false, error: friendlyError(error as Error, "signIn") };
  }
  redirect(safeNext(formData.get("next")));
}

export async function signOut() {
  await endSession();
  redirect("/");
}
