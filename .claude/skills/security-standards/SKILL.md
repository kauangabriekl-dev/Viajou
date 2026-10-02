---
name: security-standards
description: Regras de segurança e privacidade do VIAJOU (autenticação, autorização via RLS, segredos, uploads, redirecionamentos, dados pessoais, LGPD). Use SEMPRE que o trabalho tocar em login, sessão, permissões, variáveis de ambiente, upload de arquivos, dados de usuários, URLs de redirecionamento, server actions ou políticas do banco.
---

# Segurança do VIAJOU

## Modelo

Não há RLS: quem decide o que cada usuário pode fazer é **cada consulta e cada action**, que filtram por `viewerId` ou `user_id` da sessão. Uma regra esquecida numa consulta é um vazamento; por isso as regras compartilhadas ficam em `lib/db/rules.ts` e as listagens públicas sempre escondem conteúdo oculto pela moderação.

## Regras invioláveis

- **Credenciais do banco nunca** em variável `NEXT_PUBLIC_*` ou em arquivo versionado. `.env.local` fica fora do git. `.env.example` só tem nomes e valores de exemplo.
- **Nunca confie em ids do cliente para autoria.** O `user_id` sai sempre de `session.userId`.
- **Server actions são endpoints públicos**: qualquer um pode chamá-las com qualquer argumento. Valide todo argumento com Zod (`z.uuid()` para ids) e confira a sessão dentro da action.
- **Redirecionamentos** usam `safeNext()` (`lib/url.ts`), que só aceita caminhos internos. `//evil.com`, `https://...` e `/\evil.com` caem em `/`.
- **Erros** chegam ao usuário só via `friendlyError`. Mensagem crua do Postgres revela nomes de tabelas e regras.
- **Sessão** vem de `getSession()` (`lib/auth.ts`), que confere no banco o hash do token do cookie; senha com scrypt e comparação em tempo constante.

## Uploads

- Valide tipo **e** assinatura binária (`matchesSignature`), extensão coerente e tamanho, via `uploadImages()`. Arquivo HTML renomeado para `.jpg` precisa ser rejeitado, e existe teste para isso.
- O caminho é sempre `<userId>/<pasta>/<uuid>.<ext>`, gerado no servidor, e `/fotos/...` só serve nomes nesse formato.
- As fotos enviadas são públicas para leitura. Não guarde nelas nada que não deva ser público.
- A localização GPS (EXIF/XMP) é apagada antes de salvar (`lib/image-privacy.ts`).

## Abuso

- Limites no banco evitam duplicação: PKs compostas (curtida, salvo, follow), `unique` em avaliação e denúncia.
- Login e cadastro têm limite de tentativas por IP e por e-mail (`lib/rate-limit.ts`, tabela `rate_limits`). Use o mesmo `hitLimit()` ao proteger outras ações (comentários, denúncias, reclamações).
- Lugares e achadinhos da comunidade saem do ar sozinhos com 3 denúncias e voltam ou são removidos em `/moderacao` (só administradores).
- `serverActions.bodySizeLimit` está em 55 MB por causa das fotos. Não aumente, e se possível reduza, migrando para upload direto a um armazenamento de arquivos com URL assinada.

## Dados pessoais (LGPD)

- Colete o mínimo. E-mail aparece só para o próprio usuário, em `/configuracoes`. Perfis públicos mostram nome, username, bio e avatar.
- Salvos, notificações, planos de viagem e denúncias são privados por RLS. Mantenha assim.
- Reclamações são públicas: o formulário avisa para não incluir documentos, cartão ou dados de terceiros. Não remova esse aviso.
- Exclusões em cascata a partir de `auth.users` apagam o conteúdo do usuário. Arquivos no Storage precisam ser removidos junto (as actions de exclusão já fazem isso).

## Revisão rápida antes de concluir

Cada escrita nova tem política RLS e teste negando outro usuário? Algum segredo ou mensagem técnica vaza? Algum input vira caminho, URL ou HTML sem validação? Houve `dangerouslySetInnerHTML`? (Não deveria haver.) A opção `dangerouslyAllowLocalIP` do `next.config.ts` só pode ser ligada em desenvolvimento.
