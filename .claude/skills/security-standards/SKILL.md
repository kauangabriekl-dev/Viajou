---
name: security-standards
description: Regras de segurança e privacidade do VIAJOU (autenticação, autorização via RLS, segredos, uploads, redirecionamentos, dados pessoais, LGPD). Use SEMPRE que o trabalho tocar em login, sessão, permissões, variáveis de ambiente, upload de arquivos, dados de usuários, URLs de redirecionamento, server actions ou políticas do banco.
---

# Segurança do VIAJOU

## Modelo

O navegador e as server actions usam apenas a **chave anônima** do Supabase. Quem decide o que cada usuário pode fazer é o **RLS no banco**. As verificações no app melhoram as mensagens de erro, mas não são a proteção. Se uma regra só existe no TypeScript, ela não existe.

## Regras invioláveis

- **Service role nunca** no código do app, em variável `NEXT_PUBLIC_*` ou em qualquer arquivo versionado. `.env.local` fica fora do git. `.env.example` só tem nomes e valores de exemplo.
- **Nunca confie em ids do cliente para autoria.** O `user_id` sai de `session.userId`, e o RLS confere com `auth.uid()`.
- **Server actions são endpoints públicos**: qualquer um pode chamá-las com qualquer argumento. Valide todo argumento com Zod (`z.uuid()` para ids) e confira a sessão dentro da action.
- **Redirecionamentos** usam `safeNext()` (`lib/url.ts`), que só aceita caminhos internos. `//evil.com`, `https://...` e `/\evil.com` caem em `/`.
- **Erros** chegam ao usuário só via `friendlyError`. Mensagem crua do Postgres revela nomes de tabelas e regras.
- **Sessão no servidor** vem de `supabase.auth.getUser()` (validada no Auth), nunca de `getSession()` do supabase-js, que só lê o cookie.

## Uploads

- Valide tipo **e** assinatura binária (`matchesSignature`), extensão coerente e tamanho, via `uploadImages()`. Arquivo HTML renomeado para `.jpg` precisa ser rejeitado, e existe teste para isso.
- O caminho é sempre `<userId>/<pasta>/<uuid>.<ext>`, gerado no servidor. As políticas do Storage exigem que a primeira pasta seja o `auth.uid()`.
- O bucket `photos` é público para leitura. Não guarde nele nada que não deva ser público.
- **Pendente e importante**: remover metadados EXIF (incluindo GPS) antes do upload. Fotos de viagem podem revelar onde a pessoa está hospedada ou mora. Ao mexer em uploads, trate isso como prioridade.

## Abuso

- Limites no banco evitam duplicação: PKs compostas (curtida, salvo, follow), `unique` em avaliação e denúncia.
- Ainda **não há limite de requisições** para cadastro, comentários, denúncias e reclamações. Ao adicionar, prefira o rate limit do Supabase Auth para login e cadastro, e um contador por usuário e janela de tempo no banco ou num serviço como Upstash para o resto.
- `serverActions.bodySizeLimit` está em 55 MB por causa das fotos. Não aumente, e se possível reduza, migrando para upload direto ao Storage com URL assinada.

## Dados pessoais (LGPD)

- Colete o mínimo. E-mail aparece só para o próprio usuário, em `/configuracoes`. Perfis públicos mostram nome, username, bio e avatar.
- Salvos, notificações, planos de viagem e denúncias são privados por RLS. Mantenha assim.
- Reclamações são públicas: o formulário avisa para não incluir documentos, cartão ou dados de terceiros. Não remova esse aviso.
- Exclusões em cascata a partir de `auth.users` apagam o conteúdo do usuário. Arquivos no Storage precisam ser removidos junto (as actions de exclusão já fazem isso).

## Revisão rápida antes de concluir

Cada escrita nova tem política RLS e teste negando outro usuário? Algum segredo ou mensagem técnica vaza? Algum input vira caminho, URL ou HTML sem validação? Houve `dangerouslySetInnerHTML`? (Não deveria haver.) A opção `dangerouslyAllowLocalIP` do `next.config.ts` só pode ser ligada em desenvolvimento.
