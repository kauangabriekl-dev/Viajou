---
name: frontend-standards
description: Padrões de frontend do VIAJOU (Next.js 16 App Router, React 19, TypeScript strict, Tailwind 4). Use SEMPRE que for criar ou editar páginas, layouts, componentes, formulários ou rotas em app/ ou components/, mesmo em mudanças pequenas de interface, e antes de usar qualquer API do Next.js de memória.
---

# Frontend do VIAJOU

Este Next.js é a versão 16 e tem mudanças que contradizem o que você provavelmente sabe. Antes de usar uma API do Next de memória, confira em `node_modules/next/dist/docs/`.

## Diferenças do Next 16 que já causaram erro aqui

- `params` e `searchParams` são Promises. Tipe com os helpers globais, `export default async function Page({ params }: PageProps<"/lugares/[slug]">)`, e faça `await params`.
- Os tipos de rota são gerados. Uma rota nova dá erro "does not satisfy AppRoutes" até rodar `npx next typegen` (o `npm run typecheck` já faz isso).
- O middleware se chama `proxy.ts` e exporta `proxy`.
- `app/error.tsx` recebe `retry()` no lugar de `reset()`.
- **Não existe `app/loading.tsx` na raiz, de propósito.** Um loading global põe todas as páginas em streaming: o HTTP 200 sai antes de `notFound()` ou `redirect()` rodarem, gerando soft 404 (ruim para SEO) e redirect via meta refresh. Se precisar de loading, crie-o só em segmentos que nunca chamam `notFound()` ou `redirect()` e confira o status com `curl -s -o /dev/null -w '%{http_code}'`.

## Server vs Client Components

O padrão é Server Component. Use `"use client"` só quando houver estado, efeitos, eventos ou APIs do navegador. Os componentes interativos ficam pequenos e nas folhas (`LikeButton`, `ImageUploader`), e a página continua no servidor.

**Nunca passe arrow function de um Server Component para um Client Component.** O build passa, mas quebra em runtime (isso já derrubou a página de publicação):

```tsx
// ERRADO: em page.tsx (servidor)
<ConfirmAction action={() => deletePost(post.id)} />
// CERTO
<ConfirmAction action={deletePost.bind(null, post.id)} />
```

Dentro de arquivos `"use client"`, arrow functions que chamam server actions estão corretas.

## Dados

- Leituras ficam em `lib/queries.ts` e recebem o cliente do usuário (`ServerClient`). Não chame `supabase.from()` dentro de componentes.
- A sessão vem de `getSession()`, memoizada por requisição. Páginas privadas usam `await requireSession("/rota")`, que redireciona para `/login?next=`.
- Toda página que lê o banco começa com `createClientIfConfigured()`. Se vier `null`, retorne `<SetupNotice what="..." />`, para o app continuar de pé sem Supabase.
- Consulte em paralelo com `Promise.all` e carregue só a aba ativa (`?aba=`).

## Formulários

O projeto usa `useActionState` com server actions, e a validação Zod fica no servidor. React Hook Form não é usado, por decisão consciente: os formulários funcionam sem JS e a validação fica num lugar só.

- Actions retornam `ActionResult` (`lib/errors.ts`). Mostre o resultado com `<FormMessage state={state} />` e os erros de campo com `errorsFor(state, "campo")`.
- Monte os campos com `<Field>`, `inputClass` e `describedBy()`, que ligam label, dica e erro via `aria-describedby`.
- Envie com `<SubmitButton pendingLabel="Salvando…">`, que desabilita o botão durante o envio.
- Nota por estrelas: `<StarInput>` (radios acessíveis). Imagens: `<ImageUploader>`, que valida no cliente só por conforto, porque o servidor valida de novo.
- Curtir, salvar e seguir usam `ToggleButton`, com atualização otimista e rollback em caso de erro.

## Convenções

- Imports com `@/`. Tipos do banco em `types/database.ts`. Labels em pt-BR ficam em `lib/labels.ts`, nunca como valor cru de enum na UI.
- Datas e dinheiro passam por `utils/format.ts`. `formatDate` trata `YYYY-MM-DD` em UTC para não voltar um dia, e `formatCents` lida com centavos.
- Ícones vêm do lucide-react 1.x, que renomeou alguns: `Trash2` não existe (use `Trash`), `Home` virou `House`, `PlusCircle` virou `CirclePlus`. Na dúvida: `grep "declare const Nome:" node_modules/lucide-react/dist/lucide-react.d.ts`.
- Imagens usam `next/image`. `<img>` só em pré-visualização `blob:`, com o disable do ESLint comentado.
- Abas e filtros são links com query string (`<Tabs>`), não estado local, para funcionar sem JS e poder ser compartilhado e indexado.

## Antes de concluir

Rode `npm run lint && npm run typecheck && npm test && npm run build`. Para mudanças visuais, siga também `ui-design-system`. Para páginas públicas, `seo-standards`.
