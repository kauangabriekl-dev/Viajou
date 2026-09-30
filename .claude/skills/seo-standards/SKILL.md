---
name: seo-standards
description: Padrões de SEO do VIAJOU (metadata, canonical, Open Graph, status HTTP, indexação, dados estruturados, sitemap, performance). Use SEMPRE que for criar ou alterar uma página pública (destinos, lugares, viagens, roteiros, perfis, explorar), mudar URLs ou slugs, ou mexer em títulos, descrições e imagens de compartilhamento.
---

# SEO do VIAJOU

O tráfego de uma rede de avaliações vem de buscas como "pousada em Porto Seguro é boa?". Páginas de **destino** e de **lugar** são as mais importantes para SEO; trate-as com prioridade.

## Metadata

- Toda página exporta `metadata` ou `generateMetadata` usando `buildMetadata({ title, description, path })` de `lib/seo.ts`. Ele gera o título no formato "Título | VIAJOU", o canonical e o Open Graph.
- Páginas dinâmicas usam `generateMetadata` com os dados reais, e o título responde à busca:
  - Destino: `"{Nome}, {UF}: avaliações, lugares e roteiros"`
  - Lugar: `"{Nome} em {Cidade}: avaliações de viajantes"`
  - Viagem: `"Viagem de {Autor} em {Destino}"`, com a primeira foto como imagem de Open Graph.
- Descrição com até ~160 caracteres, escrita para humanos, sem repetir o título.
- `canonical` é o caminho sem query string. Abas (`?aba=`) e filtros apontam para a URL base.

## O que não indexar

Use `robots: { index: false }` em: login, cadastro, criar, criar roteiro, reclamar, configurações, minha conta, resultados de busca (`/explorar?q=`) e roteiros privados. Dados de demonstração não devem ser tratados como conteúdo real.

## Status HTTP corretos

- Conteúdo inexistente chama `notFound()` e responde **404 de verdade**. Id que não é UUID deve dar 404 antes de consultar o banco.
- Página privada sem login responde **307** para `/login?next=`.
- Um `loading.tsx` na raiz transforma isso em 200 com página de erro (soft 404). Não o recrie. Confira com `curl -s -o /dev/null -w '%{http_code}'`.

## URLs

- Slugs em minúsculas, com hífen e sem acento (`porto-seguro-ba`), validados por check no banco. Não mude slug de conteúdo publicado sem criar um redirecionamento 301.
- **Pendente**: trocar o username quebra os links antigos do perfil. Ao mexer nisso, guarde os usernames anteriores e redirecione.

## Conteúdo e HTML

- Um `h1` por página, com o nome do destino ou lugar. Seções com `h2`.
- Informações importantes (nota, número de avaliações, endereço) ficam no HTML renderizado no servidor, não carregadas depois por JS.
- Links internos entre destino, lugares, roteiros e publicações são reais (`<Link>`), e isso fortalece o rastreamento.
- Imagens com `next/image`, `alt` descritivo e `sizes` corretos. `priority` só na imagem principal acima da dobra.

## Pendências conhecidas (ainda não implementadas)

1. `app/sitemap.ts` com destinos, lugares, roteiros públicos e perfis ativos.
2. `app/robots.ts` bloqueando rotas privadas e apontando o sitemap.
3. JSON-LD na página de lugar: tipo `LocalBusiness`, `Hotel`, `Restaurant` ou `TouristAttraction`, com `aggregateRating` **somente** quando `reviews_count > 0`. Nunca invente notas; o Google penaliza marcação que não corresponde ao conteúdo visível.
4. JSON-LD `TouristDestination` na página de destino e `BreadcrumbList` nas páginas de detalhe.
5. Imagem de Open Graph padrão (`app/opengraph-image`) para páginas sem foto.

## Performance

Core Web Vitals contam. Prefira Server Components, evite JS no cliente sem necessidade, reserve espaço para imagens (width e height, ou `aspect-*`) para não haver deslocamento de layout, e mantenha a página funcional sem JavaScript.
