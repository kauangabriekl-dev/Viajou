---
name: database-standards
description: Padrões de banco do VIAJOU (PostgreSQL/Supabase, migrations, RLS, triggers, funções RPC, seed). Use SEMPRE que for criar ou alterar tabelas, colunas, índices, políticas RLS, triggers, funções SQL, o seed ou o bucket de Storage, ou quando uma consulta nova depender de uma relação entre tabelas.
---

# Banco de dados do VIAJOU

## Migrations

- Ficam em `supabase/migrations/AAAAMMDDHHMMSS_descricao.sql`. **Nunca edite uma migration já aplicada**: crie uma nova. As três atuais são `_schema`, `_rls` e `_storage`.
- Uma mudança de schema vem sempre acompanhada de: política RLS, atualização de `types/database.ts` e teste em `supabase/tests/rls.test.sql`.
- Tudo com prefixo `public.` e explícito. Funções com `set search_path`.

## Regras de modelagem

- Chaves primárias `uuid default gen_random_uuid()`. Tabelas de vínculo (curtidas, salvos, seguidores) usam PK composta, que é o que impede duplicação.
- Regras de negócio moram em constraints, não só no app: `unique (place_id, user_id)` em reviews (uma avaliação por usuário e lugar), `check (follower_id <> following_id)`, notas entre 1 e 5, `trip_end >= trip_start`, limites de tamanho de texto, e username no formato `^[a-z0-9_]{3,30}$`.
- Dinheiro em `integer` de centavos. Datas de viagem em `date`, eventos em `timestamptz`.
- Enums para conjuntos fechados (`place_type`, `complaint_status`...). Rótulos de UI ficam em `lib/labels.ts`, não no banco.
- Dados de demonstração têm `is_demo = true`, para a UI mostrar o selo.
- Toda coluna usada em filtro ou ordenação frequente leva índice. Para busca, a ideia é um índice trigram sobre `normalize_text(...)` quando o volume crescer.

## RLS: o modelo de segurança

RLS é ligado em **todas** as tabelas. O app usa só a chave anônima, então a política é a última linha de defesa.

- Conteúdo público (posts, avaliações, perfis): `select using (true)`. Escrita: `with check (user_id = auth.uid())`.
- Privado (salvos, notificações, planos, denúncias): `select using (user_id = auth.uid())`.
- Tabelas filhas herdam a visibilidade do pai via `exists (...)` (dias e paradas de roteiros privados).
- Catálogo (destinos, lugares, critérios) não tem política de escrita: só a service role escreve.
- Resposta a reclamação exige estabelecimento com `claim_status = 'verified'` e vinculado ao lugar.
- Transições de estado ficam em trigger (`guard_complaint_status`), porque o RLS não compara valor antigo e novo.

Lembre que UPDATE e DELETE bloqueados pelo RLS **não dão erro**: afetam 0 linhas. INSERT bloqueado dá `42501`.

## Funções e triggers

- `SECURITY DEFINER` só quando precisa ultrapassar o RLS de forma controlada (criar perfil, notificar, recalcular nota média), sempre com `set search_path = public`. Revogue EXECUTE de `anon` e `authenticated` quando a função não deve ser chamada direto (ex.: `notify`).
- RPCs chamadas pelo app são `SECURITY INVOKER`, para que o RLS continue valendo (`create_itinerary`, `copy_itinerary`, `search_all`).
- Notificações nascem por trigger (follow, curtida, comentário, roteiro salvo, resposta de estabelecimento), nunca pelo app, e ignoram ações do usuário sobre o próprio conteúdo.

## Relações e PostgREST

Ao criar uma segunda FK entre as mesmas tabelas, ou uma tabela de junção, as consultas que já existem ficam ambíguas e passam a falhar em runtime. Procure em `lib/queries.ts` os embeds afetados e adicione o hint `!nome_da_fk`.

## Seed

`supabase/seed.sql` contém só critérios de avaliação, destinos reais com textos próprios e lugares **fictícios** marcados "(demo)". Nunca crie usuários, avaliações ou publicações falsas no seed.

## Testar

`npm run test:db` recria um banco local, aplica stub, migrations e seed, e roda `supabase/tests/rls.test.sql`. Para cada regra nova, escreva ao menos um caso permitido e um negado, usando `tests.throws(sql, sqlstate, msg)` ou `tests.affected(sql)` (este para UPDATE e DELETE). O stub `00_local_supabase_stub.sql` imita o Supabase e **nunca** deve ser aplicado num projeto real.
