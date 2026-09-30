---
name: ui-design-system
description: Design system do VIAJOU (cores, tipografia, espaçamento, componentes, estados, acessibilidade, mobile-first). Use SEMPRE que for criar ou mudar qualquer coisa visual — tela, card, botão, formulário, estado vazio, cor, ícone ou layout — mesmo que o pedido não fale em "design".
---

# Design system do VIAJOU

A identidade é **cartão-postal brasileiro**: céu e mar do litoral, carimbo de correio, linha de trajeto. Direta, calorosa e sem parecer template genérico. Na dúvida, prefira clareza a enfeite.

## Tokens (em `app/globals.css`, bloco `@theme`)

| Token                       | Valor             | Uso                                                |
| --------------------------- | ----------------- | -------------------------------------------------- |
| `atlantico`                 | #0b4f6c           | Ação principal, links, destaque                    |
| `atlantico-900`             | #073447           | Hover da ação principal                            |
| `atlantico-100`             | #dcecf2           | Fundo de item ativo, chips selecionados            |
| `espuma`                    | #f4f8f9           | Fundo da página                                    |
| `tinta` / `tinta-soft`      | #13262f / #4a5d66 | Texto principal / secundário                       |
| `maracuja` / `maracuja-600` | #f4b52e / #d99a12 | Estrelas, CTA secundário ("Vou viajar"), selo demo |
| `restinga`                  | #2e7d66           | Sucesso, tipo de lugar, "resolvida"                |
| `linha`                     | #d7e3e8           | Bordas e divisórias                                |

Use só os tokens (`bg-atlantico`, `text-tinta-soft`). Cor nova vira token, não hex solto. Erro usa `red-700`/`red-50` do Tailwind. Texto sobre `maracuja` é sempre `tinta` (branco não passa em contraste).

Tipografia: fonte do sistema. Títulos `font-extrabold tracking-tight`; texto corrido com `max-w-prose`.

## Formas e componentes

- Cards: `rounded-[var(--radius-card)] bg-white ring-1 ring-linha`, e `hover:ring-atlantico` quando clicáveis. Sombra só em overlays.
- Botões são pílulas (`rounded-full`). Primário: `bg-atlantico text-white`. Secundário: `bg-white ring-1 ring-linha`. Destrutivo: texto neutro que vira `text-red-700` no hover, sempre com confirmação.
- Reutilize antes de criar: `Container`, `PageHeader`, `SectionHeading`, `EmptyState`, `Tabs`, `Avatar`, `RatingStars`, `DemoBadge`, `Scene`, `MapView` e os cards em `components/cards/`.
- Sem foto, use a ilustração `<Scene kind={sceneFor(...)} />`. Nunca use fotos de banco de imagens nem de terceiros.
- Destinos: cartão-postal com carimbo da UF e coordenadas. Roteiros: linha tracejada com um ponto por dia.

## Estados obrigatórios

Toda lista ou página com dados tem:

- **Vazio**: `<EmptyState>` com frase humana e, quando fizer sentido, uma ação ("Seja a primeira pessoa a…").
- **Erro**: o `error.tsx` da rota, com "Tentar de novo". Erros de formulário aparecem no campo e no topo.
- **Carregando**: botões com `pendingLabel`; ações otimistas no `ToggleButton`. Não crie `loading.tsx` na raiz (veja `frontend-standards`).
- **Sem Supabase**: `<SetupNotice>`.
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
