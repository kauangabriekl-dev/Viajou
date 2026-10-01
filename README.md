# VIAJOU

> Experiências reais de quem já esteve lá.

Rede social de viagens em que as pessoas avaliam destinos, hospedagens, restaurantes, praias e atrações, publicam relatos com fotos, montam roteiros dia a dia e registram reclamações que os estabelecimentos podem responder.

**Stack:** Next.js 16 (App Router), React 19, TypeScript strict, Tailwind CSS 4, Supabase (Auth, Postgres, Storage, RLS), Zod 4, Lucide. Deploy previsto na Vercel.

## Funcionalidades

| Área                     | O que existe                                                                                                                                                                        |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Globo da home            | Planeta 3D girável (cobe/WebGL) com os destinos do VIAJOU e busca de todos os países e ~170 mil cidades do mundo (GeoNames), com zoom até o lugar                                   |
| Achadinhos               | Foto + localização exata (mapa Leaflet/OpenStreetMap ou GPS), "Como chegar", salvar para ir; o GPS das fotos é apagado                                                              |
| Notas e dicas de destino | Nota do destino, meses recomendados, gasto por dia (mediana) e dicas por assunto (melhor época, café da manhã, onde comer, onde ficar, passeios, custo, transporte) com voto "útil" |
| Roteiro sugerido         | Dia a dia montado com as notas, recomendações e votos da comunidade, com o motivo de cada parada                                                                                    |
| Lugares da comunidade    | Em "Lugares visitados", escreva ou busque; lugar novo fica cadastrado para os próximos. Perguntas de praia: favorita, recomenda, não voltaria                                       |
| Conta                    | Cadastro com username, login por e-mail, Google opcional, perfil com avatar e bio                                                                                                   |
| Destinos e lugares       | Nota média, avaliações por critério (variam por tipo de lugar), fotos, mapa, lugares por categoria                                                                                  |
| Publicações              | Relato com até 10 fotos, datas, gasto total, nota, hotel e lugares visitados                                                                                                        |
| Social                   | Curtir, salvar, comentar, seguir, compartilhar, feed de quem você segue, notificações                                                                                               |
| Roteiros                 | Editor dia a dia com reordenação, público ou privado, copiar roteiro de outra pessoa                                                                                                |
| Reclamações              | Públicas, com fotos e status; estabelecimentos verificados respondem                                                                                                                |
| Vou viajar               | Destino, datas, pessoas, orçamento e estilo → roteiros, lugares e relatos da comunidade (sem IA)                                                                                    |
| Busca                    | Destinos, lugares, usuários e roteiros agrupados, sem diferenciar acentos                                                                                                           |
| Moderação                | Denúncias de publicações, comentários, avaliações e perfis                                                                                                                          |

## Rodando localmente

Requisitos: Node 20+ e um projeto Supabase (gratuito).

```bash
npm install
cp .env.example .env.local   # preencha URL e chave anônima do Supabase
npm run dev                  # http://localhost:3000
```

Sem Supabase configurado, o site abre mesmo assim: a home usa dados de demonstração (se `NEXT_PUBLIC_SHOW_DEMO_DATA=true`) e as outras páginas explicam o que falta.

## Banco H2 local

O site usa um banco **H2 local** (modo PostgreSQL, driver `pg`), para desenvolver offline e sem custo. Login e sessões (senha com scrypt, cookie httpOnly), leituras, escritas e fotos (em `.data/uploads`, servidas por `/fotos/...`) já rodam nele. As regras que antes eram RLS e triggers do Supabase ficam em `lib/db/` e nas Server Actions. O Supabase saiu do código; `supabase/` fica só como referência.

Diferenças do H2 que o código já trata (ver `lib/db/client.ts`): parâmetros dentro de `ARRAY[...]` quebram o servidor (tags vão como literal validado), não há `RETURNING` (ids gerados no Node), datas chegam com fuso "-03" e alguns códigos de erro mudam (23506, 23513).

Requisito: Java 17+ (JAVA_HOME, `../tools/jdk-21` ou no PATH). O jar do H2 é baixado e conferido (SHA-1) automaticamente em `.data/`.

```bash
npm run db:start     # sobe o servidor (deixe aberto)
npm run db:migrate   # em outro terminal: aplica as migrations
npm run db:seed      # critérios + destinos/lugares de demonstração (só local)
npm run db:status    # o que foi aplicado e quantos registros há
```

O seed de demonstração se recusa a rodar com `NODE_ENV=production` (use `--sem-demo`). Para apagar o banco local: `node scripts/db.mjs reset --confirmar`.

## Configurando o Supabase

1. Crie um projeto em [supabase.com](https://supabase.com) e copie **Project URL** e **anon public key** (Project Settings → API) para o `.env.local`.
2. Aplique as migrations, em ordem. Pelo CLI: `npx supabase link --project-ref <id>` e depois `npx supabase db push`. Pelo painel: cole cada arquivo de `supabase/migrations/` no SQL Editor.
   - `..._schema.sql`: tabelas, constraints, triggers e funções
   - `..._rls.sql`: políticas de segurança
   - `..._storage.sql`: bucket `photos` (público, 5 MB, JPG/PNG/WebP)
3. (Opcional) Rode `supabase/seed.sql` para criar critérios de avaliação, 5 destinos e lugares **fictícios** marcados "(demo)". O seed não cria usuários nem avaliações.
4. Em Authentication → URL Configuration, cadastre `http://localhost:3000/auth/callback` e a URL de produção.
5. Para login com Google: habilite o provedor no Supabase e defina `NEXT_PUBLIC_ENABLE_GOOGLE_AUTH=true`.

Os critérios de avaliação (`review_categories`) são obrigatórios para o formulário de avaliação exibir as notas por critério, então rode o seed ou cadastre-os.

**A service role key não é usada pelo app.** Toda a segurança vem do RLS. Use a service role só no painel ou em scripts administrativos, nunca no `.env.local` do site.

## Variáveis de ambiente

| Variável                         | Obrigatória | Descrição                                                         |
| -------------------------------- | ----------- | ----------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`       | sim         | URL do projeto                                                    |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`  | sim         | Chave anônima (pública)                                           |
| `NEXT_PUBLIC_SITE_URL`           | sim         | URL do site, para SEO e links de e-mail                           |
| `NEXT_PUBLIC_SHOW_DEMO_DATA`     | não         | Mostra dados de demonstração na home quando não há Supabase       |
| `NEXT_PUBLIC_ENABLE_GOOGLE_AUTH` | não         | Exibe "Continuar com Google"                                      |
| `NEXT_IMAGES_ALLOW_LOCAL_IP`     | não         | Só em desenvolvimento com `supabase start` (imagens em 127.0.0.1) |

## Scripts

| Comando                       | O que faz                                                                          |
| ----------------------------- | ---------------------------------------------------------------------------------- |
| `npm run dev`                 | Servidor de desenvolvimento                                                        |
| `npm run build` / `npm start` | Build e servidor de produção                                                       |
| `npm run lint`                | ESLint (inclui Prettier)                                                           |
| `npm run typecheck`           | Gera os tipos de rota e roda o TypeScript                                          |
| `npm test`                    | Testes unitários (Vitest): validação, erros, imagens, redirecionamento, formatação |
| `npm run test:db`             | Testes de banco: RLS, constraints, triggers e RPCs num PostgreSQL local            |

A base de países e cidades do globo (`data/geo/places.json`) é gerada a partir do [GeoNames](https://www.geonames.org) (CC BY 4.0) e já vem versionada. Para atualizar, baixe `cities1000.zip` (descompactado), `countryInfo.txt` e `admin1CodesASCII.txt` de `download.geonames.org/export/dump/` numa pasta e rode `node scripts/build-geo.mjs <pasta>`.

As fotos de paisagem ficam em `public/images`, são de licença livre (Wikimedia Commons) e têm autor, licença e link registrados em `lib/photos.ts`. O crédito aparece junto de cada foto e em `/creditos`.

`test:db` precisa de um PostgreSQL local (`PGHOST`, `PGUSER`, `PGPASSWORD`; padrão `localhost`/`postgres`). Ele recria o banco `viajou_test` a cada execução e usa um stub que imita o Supabase (`supabase/tests/00_local_supabase_stub.sql`), que **nunca** deve ser aplicado num projeto real.

## Estrutura

```
app/                 rotas (App Router)
components/          UI: cards, forms, social, layout, ui...
lib/actions/         server actions (todas as escritas)
lib/queries.ts       leituras do banco
lib/validation.ts    schemas Zod
lib/supabase/        clientes Supabase (servidor, navegador, proxy)
lib/globe.ts         projeção do globo 3D da home
lib/geo-search.ts    busca de países e cidades (dados em data/geo/)
lib/photos.ts        fotos de licença livre e seus créditos
public/images/       fotos de paisagem (destinos e home)
supabase/            migrations, seed e testes SQL
tests/               testes unitários
types/database.ts    tipos das tabelas
.claude/skills/      padrões do projeto para o Claude Code
```

## Padrões do projeto

As regras de código, design, banco, segurança, SEO, testes e produto estão em `.claude/skills/` e são lidas automaticamente pelo Claude Code. Vale lê-las antes de contribuir, também para humanos.

Uma decisão que difere da especificação original: **React Hook Form não foi usado.** Os formulários usam `useActionState` com server actions e validação Zod no servidor, e funcionam sem JavaScript.

## Status e limitações

Verificado: 34 testes unitários, 43 testes de banco, e um teste de ponta a ponta no navegador com dois usuários (cadastro, publicação com foto, avaliação, roteiro, curtidas, comentários, seguidores, cópia de roteiro, reclamação, busca, "Vou viajar", notificações e exclusão), feito contra PostgREST e Postgres locais. **Ainda não foi testado contra um projeto Supabase hospedado.**

Conhecido e ainda não feito:

- Metadados EXIF (inclusive GPS) não são removidos das fotos (prioridade de privacidade)
- Sem limite de requisições em cadastro, comentários e denúncias
- Sem `sitemap.xml`, `robots.txt` e dados estruturados (JSON-LD)
- Mapa é um placeholder com link para o OpenStreetMap
- Usuários não cadastram lugares; o catálogo é mantido pela equipe
- Sem painel de moderação nem de estabelecimentos (a estrutura no banco existe)
- Trocar o username quebra links antigos do perfil
