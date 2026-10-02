---
name: database-standards
description: Padrões de banco do VIAJOU (H2 em modo PostgreSQL, migrations, regras no app, seed). Use SEMPRE que for criar ou alterar tabelas, colunas, índices, o seed, as consultas de lib/queries.ts ou qualquer regra de quem pode ler ou escrever o quê.
---

# Banco de dados do VIAJOU

## Onde fica

- Banco **H2 2.5** em modo PostgreSQL, servidor local na porta 5435 (`npm run db:start`), dados em `.data/db`. O app conecta pelo driver `pg` (`lib/db/client.ts`).
- Migrations em `db/migrations/NNNN_descricao.sql`, aplicadas em ordem por `npm run db:migrate`. **Nunca edite uma migration já aplicada**: crie a próxima. Toda mudança de schema atualiza também `types/database.ts`.
- Seeds em `db/seed/` (critérios, destinos do mundo, demonstração). `02_demo_local.sql` só roda fora de produção.

## Particularidades do H2

- `DEFAULT` vem antes de `PRIMARY KEY` na definição da coluna.
- Não há `RETURNING`: gere ids com `crypto.randomUUID()` no Node e insira.
- Parâmetro dentro de `ARRAY[...]` derruba o servidor: use `sqlArray()` (literais validados) e `inList()` (um parâmetro por item).
- `"key"` é palavra reservada: use aspas.
- DDL faz commit automático: não conte com rollback de migration.
- Erros: `23505` (único), `23506` (chave estrangeira), `23513` (CHECK).
- Datas chegam como `2026-10-01 09:32:51-03`: converta com `toIsoTimestamp` (`lib/db/dates.ts`).

## Regras de modelagem

- Chaves primárias `UUID DEFAULT RANDOM_UUID()`. Tabelas de vínculo (curtidas, salvos, seguidores) usam chave composta, que impede duplicação.
- Regras de negócio também em constraints: uma avaliação por usuário e lugar, notas de 1 a 5, `end_date >= start_date`, tamanho de textos, username `^[a-z0-9_]{3,30}$`.
- Dinheiro em inteiro de centavos. Datas de viagem em `DATE`, eventos em `TIMESTAMP WITH TIME ZONE`.
- Conjuntos fechados em `CHECK (coluna IN (...))`; rótulos de UI ficam em `lib/labels.ts`.
- Dados de demonstração têm `is_demo = TRUE`, para a UI mostrar o selo.
- Coluna usada em filtro ou ordenação frequente leva índice.

## Quem pode ler e escrever (as regras vivem no app)

Não existe RLS: **toda** consulta e ação aplica a regra explicitamente.

- Leituras em `lib/queries.ts` recebem o `viewerId` quando o conteúdo pode ser privado (roteiros, planos, salvos) e filtram por ele.
- Escritas em `lib/actions/` começam com `requireSession()` e conferem o dono com `WHERE user_id = $n`; use o `rowCount` de `exec()` para saber se a linha era mesmo da pessoa.
- Regras compartilhadas (nota média do lugar, notificações, visibilidade de roteiro, dono do conteúdo) ficam em `lib/db/rules.ts`.
- Conteúdo da comunidade oculto pela moderação (`hidden_at` preenchido) não aparece em nenhuma listagem pública.
- Notificações ignoram ações do usuário sobre o próprio conteúdo.

## Seed

Só critérios de avaliação, destinos reais com textos próprios e lugares **fictícios** marcados "(demo)". Nunca crie usuários, avaliações ou publicações falsas.

## Testar

Funções puras (motor de roteiros, validação, datas) têm testes em `tests/` (`npm test`). Regras de acesso novas devem ser conferidas também num teste de ponta a ponta com dois usuários (um dono, um não dono).
