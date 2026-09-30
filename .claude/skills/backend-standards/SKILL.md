---
name: backend-standards
description: Padrões de backend do VIAJOU (server actions, Supabase SSR, validação com Zod 4, tratamento de erros, uploads). Use SEMPRE que for criar ou alterar arquivos em lib/actions/, lib/queries.ts, lib/supabase/, route handlers, schemas de validação ou qualquer código que escreva no banco ou no Storage.
---

# Backend do VIAJOU

## Arquitetura

- **Escritas** são server actions em `lib/actions/<domínio>.ts`, com `"use server"`.
- **Leituras** ficam em `lib/queries.ts`, com `import "server-only"`.
- **Clientes Supabase**: `lib/supabase/server.ts` (servidor, com cookies), `client.ts` (navegador) e `proxy.ts` (renova a sessão). Todos usam a chave anônima, porque a segurança vem do RLS.
- **A service role nunca entra no app.** Tarefas administrativas ficam em scripts ou no painel do Supabase.

## Anatomia de uma server action

A ordem abaixo existe por um motivo: nada chega ao banco sem validação e sessão.

```ts
export async function createX(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  // 1. Validar antes de tocar no banco
  const parsed = xSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    return {
      ok: false,
      error: "Revise os campos destacados.",
      fieldErrors: fieldErrors(parsed.error),
    };
  // 2. Sessão
  const session = await getSession();
  if (!session) return { ok: false, error: "Entre na sua conta para continuar." };
  // 3. Escrever com user_id da sessão (o RLS confere de novo)
  const { error } = await session.supabase
    .from("x")
    .insert({ ...parsed.data, user_id: session.userId });
  if (error) return { ok: false, error: friendlyError(error, "createX") };
  // 4. Revalidar e responder
  revalidatePath("/rota");
  return { ok: true, message: "Pronto." };
}
```

- Actions chamadas com argumentos (toggles, exclusões) validam o id com `z.uuid()`, porque são endpoints públicos e qualquer um pode chamá-los.
- `redirect()` fica fora de try/catch, pois funciona lançando uma exceção.
- Em UPDATE e DELETE, filtre também por `user_id` e acrescente `.select("id")`. O RLS filtra em silêncio (0 linhas, sem erro), então "nada aconteceu" precisa virar uma mensagem clara.
- Operações que precisam ser atômicas em várias tabelas viram RPC em SQL (`create_itinerary`, `copy_itinerary`). Quando não dá, faça compensação: se as fotos falham, apague o post e os arquivos já enviados.

## Erros

- Nunca exiba `error.message` do Postgres ou do Supabase. Use `friendlyError(error, contexto)`, que registra no log fora de produção e devolve um texto amigável.
- Código de erro novo recebe mapeamento em `lib/errors.ts` e um teste em `tests/utils.test.ts`.
- Em `queries.ts`, `unwrap` (listas) e `unwrapOne` (item único) lançam erro, e o `error.tsx` da rota responde.

## Zod 4: armadilhas reais

- `z.email().trim()` valida o formato **antes** de aparar espaços, então rejeita e-mail digitado com espaço no fim. Use `z.string().trim().toLowerCase().pipe(z.email(...))`.
- `pipe` exige que a entrada do schema seguinte aceite a saída anterior. Para número opcional vindo de formulário, use `z.preprocess((v) => (v === "" ? undefined : v), numero.optional())`.
- Campos vazios chegam como `""`. Normalize com `optionalText`, `optionalDate` e `optionalUuid`.
- Dinheiro chega como `"3.200,50"` e é salvo em centavos, como inteiro. Nunca guarde float.

## Tipagem das consultas

O cliente não é gerado, então o resultado precisa ser tipado:

- Listas: `.overrideTypes<T[], { merge: false }>()`.
- Item único: `.maybeSingle<T>()`. Não combine `maybeSingle()` com `overrideTypes<T | null>`, que gera o erro "Cannot cast array result".
- Relações ambíguas pedem hint de chave estrangeira, como em `author:profiles!posts_user_id_fkey(...)`. `posts` tem duas relações com `places` (o hotel e `post_places`), e sem o hint o PostgREST falha em runtime.
- Contagens: `likes:post_likes(count)` e depois `countOf(row.likes)`.

## Uploads

Use sempre `uploadImages()` de `lib/storage.server.ts`. Ela confere MIME, extensão, tamanho (5 MB) e **assinatura binária**, grava em `<userId>/<pasta>/<uuid>.<ext>` e desfaz os envios se algo falhar. Nunca aceite nome ou caminho de arquivo vindo do cliente.

## Checklist

Validação Zod → sessão → escrita com `user_id` → `friendlyError` → `revalidatePath`. Se criou tabela ou permissão, siga também `database-standards` e `security-standards`.
