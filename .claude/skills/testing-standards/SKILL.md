---
name: testing-standards
description: Padrões de teste e QA do VIAJOU (Vitest, testes SQL de RLS, verificação de build e de status HTTP, teste manual no navegador). Use SEMPRE que for escrever ou alterar testes, corrigir um bug, ou antes de declarar qualquer tarefa como pronta — inclusive mudanças que parecem pequenas.
---

# Testes e QA do VIAJOU

A regra principal: **o build passar não prova que funciona.** Nesta base, bugs sérios passaram por lint, typecheck e build e só apareceram em runtime (arrow function passada do servidor para o cliente, relação ambígua no PostgREST, soft 404). Verifique o comportamento, não só a compilação.

## Camadas

| Comando                              | O que cobre                                                     | Onde                          |
| ------------------------------------ | --------------------------------------------------------------- | ----------------------------- |
| `npm test`                           | Validação Zod, `friendlyError`, imagens, `safeNext`, formatação | `tests/*.test.ts` (Vitest)    |
| `npm run test:db`                    | RLS, constraints, triggers, RPCs, Storage                       | `supabase/tests/rls.test.sql` |
| `npm run lint` / `npm run typecheck` | Estilo e tipos (inclui `next typegen`)                          | —                             |
| `npm run build`                      | Compilação de produção                                          | —                             |

`test:db` precisa de PostgreSQL local (`PGHOST`, `PGUSER`, `PGPASSWORD`). Ele recria o banco do zero a cada execução.

## O que testar em cada mudança

- **Schema Zod novo ou alterado**: caso válido, cada regra de rejeição e a normalização (vazio vira `undefined`, reais viram centavos).
- **Política RLS ou constraint nova**: um caso permitido e um negado, com o usuário certo. Troque de papel com `select tests.as_user('<uuid>'); set role authenticated;` e volte com `reset role;`.
  - INSERT negado: `tests.throws(sql, '42501', msg)`.
  - UPDATE e DELETE negados **não dão erro**: use `tests.ok(tests.affected(sql) = 0, msg)`.
  - Violações: `23505` para duplicado, `23514` para check.
- **Bug corrigido**: primeiro um teste que falha, depois a correção.
- **Página nova**: confira o status HTTP real. Conteúdo inexistente deve dar 404 e página privada sem login deve dar 307 para `/login?next=`:
  ```bash
  curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' localhost:3000/rota
  ```

## Testes de qualidade

- Um teste que passa de primeira pode estar errado. Ao escrever um teste de banco, confirme que ele falharia sem a regra, por exemplo usando um slug que não existe e vendo o teste acusar.
- Quando um teste falha, descubra se o bug é do código ou do teste antes de mudar qualquer um dos dois. Olhe screenshot, log ou dados, e não conclua pelo nome da asserção.
- Seletores de interface por papel e nome acessível (`getByRole("button", { name: "Curtir" })`), nunca por classe CSS. Se não dá para selecionar assim, provavelmente há um problema de acessibilidade.
- Datas em teste são fixas (passe `now` para `formatRelativeDate`).

## Fluxos críticos para testar no navegador

Antes de uma entrega, percorra com **dois usuários**: cadastro (e username duplicado), login com senha errada, publicar com foto (e arquivo falso renomeado para .jpg), avaliar (e tentar avaliar de novo), montar e reordenar roteiro, curtir, salvar, comentar, seguir, copiar roteiro, reclamar, buscar sem acento, "Vou viajar", notificações do primeiro usuário, e excluir o próprio conteúdo. Repita as telas principais em 390px e confira se há rolagem horizontal.

## Definição de pronto

Lint, typecheck, `npm test`, `npm run test:db` e build passando, mais o fluxo afetado exercitado de verdade. Se algo não pôde ser verificado, diga isso explicitamente em vez de declarar pronto.
