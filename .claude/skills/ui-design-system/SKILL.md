---
name: ui-design-system
description: Design system do VIAJOU (cores, tipografia, espaçamento, componentes, estados, acessibilidade, mobile-first). Use SEMPRE que for criar ou mudar qualquer coisa visual — tela, card, botão, formulário, estado vazio, cor, ícone ou layout — mesmo que o pedido não fale em "design".
---

# Design system do VIAJOU

A identidade é **azul-petróleo + verde-água com fotos reais de lugares**, e o **planeta 3D no centro da home** (`DestinationGlobe`, com busca de todos os países e cidades). Referências: painéis petróleo com frase dividida (peso fino + negrito), botões em pílula verde-água, linhas de trajeto tracejadas. Na dúvida, prefira clareza a enfeite.

## Tokens (em `app/globals.css`, bloco `@theme`)

| Token                           | Valor             | Uso                                                    |
| ------------------------------- | ----------------- | ------------------------------------------------------ |
| `petroleo`                      | #1e5b74           | Ação principal, painéis, títulos, links                |
| `petroleo-900` / `petroleo-950` | #0f3b4d / #0a2a37 | Hover da ação principal / rodapé                       |
| `petroleo-100`                  | #ddeef1           | Fundo de item ativo, chips selecionados                |
| `espuma`                        | #f4f9f9           | Fundo da página                                        |
| `tinta` / `tinta-soft`          | #0f2a35 / #4a6571 | Texto principal / secundário                           |
| `agua` / `agua-600`             | #5ed3c4 / #34b3a3 | CTA ("Publicar", "Buscar"), destaques, pontos do globo |
| `agua-700`                      | #0b6e64           | Texto verde-água sobre fundo claro (contraste 5,9:1)   |
| `sol`                           | #f6b93b           | Estrelas de nota e o sol das ilustrações               |
| `restinga`                      | #2e8b6e           | Sucesso, "resolvida"                                   |
| `linha`                         | #d6e6e9           | Bordas e divisórias                                    |

Use só os tokens (`bg-petroleo`, `text-tinta-soft`). Cor nova vira token, não hex solto. Erro usa `red-700`/`red-50` do Tailwind.

- Texto sobre `agua` é sempre `tinta` (branco não passa em contraste). **Nunca** use `text-agua` sobre fundo claro: use `text-agua-700`. `text-agua` só sobre petróleo ou foto escurecida.
- O foco é em duas cores (contorno `tinta` + halo `agua`), visível no claro, no petróleo e sobre fotos. Não sobrescreva.

Tipografia: **Poppins** (`next/font/google`, servida pelo próprio site). Títulos misturam peso fino e negrito: `<span class="font-light">Destinos que</span> <span class="font-bold">estão bombando</span>` (`SectionHeading` com `lead` + `title`). Texto corrido em `font-light` com `max-w-prose`.

## Formas e componentes

- Cards: `rounded-[var(--radius-card)]` (1,5rem). Card de destino é petróleo com foto em cima; demais cards `bg-white ring-1 ring-linha`.
- Botões são pílulas (`rounded-full`, mínimo 44px). Primário: `bg-petroleo text-white`. Chamada forte: `bg-agua text-tinta`. Secundário: borda `petroleo/30`. Destrutivo: texto neutro que vira `text-red-700` no hover, sempre com confirmação.
- Painéis de destaque (`ShareCta`, faixa do Hero): `bg-petroleo`, frase dividida por uma linha vertical, linha de trajeto tracejada em `agua` ao fundo.
- Reutilize antes de criar: `Container`, `PageHeader`, `SectionHeading`, `EmptyState`, `Tabs`, `Avatar`, `RatingStars`, `DemoBadge`, `Scene`, `MapView`, `PhotoCredit` e os cards em `components/cards/`.
- Roteiros: linha tracejada com um ponto por dia.

## Fotos

- **Paisagens de destino e da home**: fotos de licença livre do Wikimedia Commons, salvas em `public/images` e registradas em `lib/photos.ts` com autor, licença e link. Todo uso mostra `<PhotoCredit>` junto da foto, e a página `/creditos` lista todas. Foto nova sem crédito completo não entra.
- Capa de destino: `destinationCover(slug, cover_url)`. A foto cadastrada no banco tem prioridade.
- **Relatos, avaliações e reclamações**: só fotos reais enviadas pelos usuários. Nunca ilustre conteúdo de usuário com foto de terceiros.
- Sem foto, use a ilustração `<Scene kind={sceneFor(...)} />`.

## Globo

- O globo (`components/home/DestinationGlobe.tsx`, biblioteca `cobe`) tem pontos `agua` para destinos do VIAJOU e um ponto branco para o lugar buscado. A busca (`GlobeSearch`) é um combobox ARIA que consulta `/api/lugares` (dados do GeoNames em `data/geo/places.json`, gerados por `scripts/build-geo.mjs`, crédito em `/creditos`).
- Lugar sem página no VIAJOU mostra estado vazio honesto ("Ainda não há avaliações…"), nunca nota ou número.
- Matemática de projeção em `lib/globe.ts` (testada). Sem WebGL, o globo some e a busca do Hero e a lista de destinos continuam.

## Estados obrigatórios

Toda lista ou página com dados tem:

- **Vazio**: `<EmptyState>` com frase humana e, quando fizer sentido, uma ação ("Seja a primeira pessoa a…").
- **Erro**: o `error.tsx` da rota, com "Tentar de novo". Erros de formulário aparecem no campo e no topo.
- **Carregando**: botões com `pendingLabel`; ações otimistas no `ToggleButton`. Não crie `loading.tsx` na raiz (veja `frontend-standards`).
- **Demo**: `<DemoBadge>` sempre que houver dado de demonstração.

## Mobile-first

- Escreva as classes para 390px primeiro e expanda com `sm:`, `lg:`. Abaixo de `lg` há barra de navegação fixa no rodapé; o conteúdo tem `pb-24` para não ficar escondido.
- Área de toque de pelo menos 44px. Carrosséis horizontais com `snap-x` no celular viram grade em `sm:`.
- Nunca pode haver rolagem horizontal da página. Filtros e carrosséis largos rolam dentro de `overflow-x-auto`, **sempre com `relative` no mesmo elemento**. `overflow` não contém filhos `position: absolute` se o container não for posicionado. Isso inclui os textos `sr-only`, e foi o que já esticou a home para 1348px no celular. Cards clicáveis também levam `relative`.
- Grades sempre com colunas explícitas a partir do celular: `grid grid-cols-1 sm:grid-cols-2`, nunca só `grid sm:grid-cols-2`. Sem isso, a trilha implícita é `auto` e um texto com `truncate` estica o card em vez de ser cortado (já vazou 53px em `/explorar`). Colunas customizadas usam `minmax(0,1fr)`, não `1fr`.
- Verifique no celular rolando de fato: `window.scrollTo(500, 0)` seguido de `window.scrollX === 0`. Comparar `scrollWidth` com `innerWidth` engana em emulação mobile, porque o navegador reduz o zoom para caber o conteúdo.

## Acessibilidade (não é opcional)

- Um `h1` por página, títulos em ordem, landmarks (`nav` com `aria-label`, `main#conteudo`, link "Pular para o conteúdo").
- Ícones decorativos com `aria-hidden`. Botão só com ícone tem `aria-label` ou texto `sr-only`.
- Toggles usam `aria-pressed`. A aba atual tem `aria-current="page"`. Mensagens usam `role="alert"` ou `role="status"`.
- Todo campo tem `<label>`, e o erro fica ligado por `aria-describedby`. Controles customizados (estrelas, chips) são inputs nativos escondidos com `sr-only` e foco visível via `has-focus-visible:`.
- Alt de foto vem da descrição escrita pelo usuário, com fallback descritivo.

## Linguagem

Português do Brasil, segunda pessoa, frases curtas. Erros explicam o que fazer ("Confirme seu e-mail antes de entrar"), sem jargão técnico. Contagens com singular e plural corretos: use `pluralize()` ("1 seguidor", nunca "1 seguidores").
