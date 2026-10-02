# Publicando o Viajou

O desenvolvimento usa H2 local e fotos em disco. Para publicar, quatro peças precisam mudar. O código já está preparado para a primeira; as outras dependem de contas que só você pode criar.

## 1. Banco PostgreSQL gerenciado

O app fala o protocolo do Postgres pelo driver `pg`. Defina:

```
DATABASE_URL=postgres://usuario:senha@host:5432/viajou
DB_SSL=true          # padrão; use false só em rede privada sem SSL
```

Com `DATABASE_URL`, o app e `scripts/db.mjs` ignoram os `DB_*` locais.

**As migrations estão no dialeto do H2.** Antes de rodar `npm run db:migrate` num Postgres, é preciso uma versão Postgres delas. As diferenças conhecidas:

| No H2 (`db/migrations`)                         | No Postgres                               |
| ----------------------------------------------- | ----------------------------------------- |
| `UUID DEFAULT RANDOM_UUID()`                    | `UUID DEFAULT gen_random_uuid()`          |
| `VARCHAR(40) ARRAY DEFAULT ARRAY[] NOT NULL`    | `VARCHAR(40)[] DEFAULT '{}' NOT NULL`     |
| `REGEXP_LIKE(coluna, 'padrão')`                 | `coluna ~ 'padrão'` (ou `regexp_like`, Postgres 15+) |
| `CHAR_LENGTH`, `ON CONFLICT DO NOTHING`, `LEFT` | iguais                                    |

Recomendação: criar `db/migrations-postgres/` com as 6 migrations traduzidas e testá-las num Postgres local (Docker ou instalação) antes do primeiro deploy. Isso ainda **não foi feito nem testado**.

As consultas do app (`lib/queries.ts`, `lib/actions/`) usam SQL padrão e foram escritas para o modo PostgreSQL do H2; ainda assim, rode o teste de ponta a ponta contra o Postgres antes de abrir o site.

## 2. Armazenamento das fotos dos usuários

Hoje as fotos vão para `UPLOAD_DIR` (padrão `.data/uploads`) e são servidas por `/fotos/...`. Isso funciona num servidor com disco persistente (uma VPS, por exemplo), mas **não** em hospedagens sem disco, como a Vercel.

Opções:

- **Servidor com disco** (VPS, Railway com volume, Fly.io com volume): basta apontar `UPLOAD_DIR` para o volume e fazer backup dele.
- **Armazenamento de objetos** (S3, Cloudflare R2, Supabase Storage): trocar as funções de `lib/storage.server.ts` (`uploadImages`, `removeImages`, `uploadFilePath`) por chamadas ao serviço e a rota `/fotos` por URLs públicas. A remoção de GPS (`lib/image-privacy.ts`) continua antes do envio.

## 3. Fotos de referência fora do Git

`public/images` tem cerca de 61 MB (fotos de destinos e roteiros, todas com licença livre). Funciona, mas deixa o repositório pesado. Opções, da mais simples à mais limpa:

1. Deixar como está até o repositório incomodar.
2. Git LFS para os próximos arquivos (`git lfs track "public/images/**"`). Mover o histórico antigo exige reescrever o histórico do Git: combine antes com quem usa o repositório.
3. Subir as imagens para um CDN ou armazenamento de objetos e trocar o `src` em `data/photos.json` e `lib/photos.ts` pela URL pública.

## 4. Segredos e configuração

- Senha forte no banco, nunca a padrão `viajou`.
- `NEXT_PUBLIC_SITE_URL` com o domínio real.
- `NODE_ENV=production`: o seed recusa os dados de demonstração (`npm run db:seed -- --sem-demo`).
- Crie o primeiro administrador para a moderação: `node scripts/db.mjs admin <username>`.

## Checklist do primeiro deploy

- [ ] Postgres criado e `DATABASE_URL` definido
- [ ] Migrations traduzidas para Postgres e aplicadas
- [ ] `npm run db:seed -- --sem-demo`
- [ ] Fotos dos usuários num volume persistente ou armazenamento de objetos
- [ ] `NEXT_PUBLIC_SITE_URL` com o domínio
- [ ] Administrador criado
- [ ] Teste de ponta a ponta contra o ambiente publicado (cadastro, plano no Vou viajar, relato com foto, denúncia)
