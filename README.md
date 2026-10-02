# VIAJOU

> Experiências reais de quem já esteve lá.

Plataforma de viagens em português que monta roteiros sob medida a partir do perfil da pessoa e da experiência de quem já foi, sem repetir programas nem inventar atividades. A comunidade avalia destinos e lugares, publica relatos e achadinhos, e isso melhora os roteiros de quem vai depois.

**Stack:** Next.js 16 (App Router), React 19, TypeScript strict, Tailwind CSS 4, banco H2 local em modo PostgreSQL (driver `pg`), Zod 4, Lucide, Leaflet e cobe.

## Funcionalidades

| Área                 | O que existe                                                                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vou viajar           | Destino, datas, pessoas, orçamento e "Conte sobre você" → roteiro sob medida, explicado, sem repetições (`lib/trip-builder.ts`)                   |
| Roteiros             | Vitrine única com roteiros da equipe (dia a dia, onde ficar, custos) e da comunidade; editor dia a dia, público ou privado, copiar               |
| Destinos             | 87 destinos no Brasil e no mundo, filtro por região e estilo (praia, frio e neve, montanha, trilha…), fotos, clima e melhores meses              |
| Assistente de viagem | Quando ir (clima médio de 10 anos), previsão de 7 dias, o que levar, ingressos oficiais, documentos e hospedagem                                   |
| Hospedagem           | Busca por qualquer cidade, mapa com "Buscar nesta área" e links de comparação para Booking, Airbnb, Expedia, Google e Kayak                       |
| Achadinhos           | Lugar especial com foto e localização (mapa ou GPS); o GPS das fotos é apagado                                                                    |
| Relatos e avaliações | Relato com até 10 fotos, avaliação por critério, lugares visitados, perguntas de praia, dicas do destino com voto "útil"                          |
| Social               | Curtir, salvar, comentar, seguir, notificações                                                                                                     |
| Moderação            | Denúncias de publicações, comentários, avaliações, perfis, lugares e achadinhos; conteúdo muito denunciado sai do ar até revisão em `/moderacao` |
| Home                 | Globo 3D com busca de 246 países e ~171 mil cidades (GeoNames)                                                                                    |

## Rodando localmente

Requisitos: Node 20+ e Java 17+ (o H2 roda em Java; um JDK portátil em `../tools/jdk-21` também funciona).

```bash
npm install
cp .env.example .env.local   # os valores padrão já servem para desenvolver
npm run db:start             # deixe rodando num terminal próprio
npm run db:migrate           # cria as tabelas (db/migrations)
npm run db:seed              # critérios, destinos do mundo e dados de demonstração
npm run dev                  # http://localhost:3000
```

`npm run db:seed -- --sem-demo` não cria os lugares fictícios "(demo)". Com `NODE_ENV=production` o seed recusa os dados de demonstração.

## Scripts

| Comando                                      | Para quê                                                           |
| -------------------------------------------- | ------------------------------------------------------------------ |
| `npm run db:start / migrate / seed / status` | Servidor H2, migrations, seed e situação do banco                  |
| `npm test`                                   | Testes unitários (Vitest)                                          |
| `npm run lint` / `npm run typecheck`         | ESLint e TypeScript                                                |
| `node scripts/fetch-photos.mjs`              | Fotos de licença livre (Wikimedia) para destinos e dias de roteiro |
| `node scripts/fetch-climate.mjs`             | Clima médio mensal dos destinos (Open-Meteo)                       |
| `node scripts/fetch-attractions.mjs`         | Pontos turísticos mais procurados perto de cada destino (Wikipédia) |
| `node scripts/build-geo.mjs`                 | Base de países e cidades do globo (GeoNames)                       |

Os scripts `fetch-*` só buscam o que falta (`--refazer` busca tudo de novo) e precisam do banco rodando.

## Variáveis de ambiente

| Variável                              | Padrão                  | Uso                                |
| ------------------------------------- | ----------------------- | ---------------------------------- |
| `NEXT_PUBLIC_SITE_URL`                | `http://localhost:3000` | URL pública (SEO, links absolutos) |
| `DB_HOST` / `DB_PORT`                 | `127.0.0.1` / `5435`    | Endereço do banco                  |
| `DB_NAME` / `DB_USER` / `DB_PASSWORD` | `viajou`                | Credenciais do banco               |
| `UPLOAD_DIR`                          | `.data/uploads`         | Onde ficam as fotos enviadas       |
| `JAVA_HOME`                           | —                       | Java usado pelo H2                 |

## Estrutura

```
app/            páginas e rotas (App Router)
components/     componentes por área (assistant, trips, destinations, achados…)
lib/            regras de negócio, consultas (queries.ts), ações (actions/), motor de roteiros
db/             migrations e seeds do banco
data/           dados de referência gerados pelos scripts (cidades, fotos, clima, atrações)
scripts/        banco H2 e coleta de dados
tests/          testes unitários
docs/           guias de operação (deploy)
```

## Antes de ir para produção

O H2 e as fotos em disco local servem para desenvolver. O passo a passo para publicar está em [`docs/deploy.md`](docs/deploy.md): PostgreSQL gerenciado, armazenamento de arquivos para as fotos dos usuários, fotos de referência fora do Git e senha forte no banco.

## Créditos dos dados

Fotos: Wikimedia Commons (autor e licença em `/creditos`). Cidades: GeoNames (CC BY 4.0). Clima e previsão: Open-Meteo (CC BY 4.0). Mapas: OpenStreetMap. Atrações: Wikipédia.
