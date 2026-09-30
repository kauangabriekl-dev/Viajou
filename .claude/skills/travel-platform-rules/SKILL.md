---
name: travel-platform-rules
description: Regras de negócio e de produto do VIAJOU (avaliações, publicações, roteiros, reclamações, estabelecimentos, "Vou viajar", notificações, moderação, dados de demonstração). Use SEMPRE que for criar ou mudar uma funcionalidade, fluxo, texto de produto ou regra de conteúdo, ou quando houver dúvida sobre como algo deve se comportar na plataforma.
---

# Regras da plataforma VIAJOU

**Promessa do produto:** "Experiências reais de quem já esteve lá." Toda decisão protege a confiança no conteúdo. Diante de uma escolha entre crescer mais rápido e manter o conteúdo confiável, escolha o conteúdo confiável.

## Conteúdo real, sempre

- **Nunca invente** usuários, avaliações, notas, relatos, fotos, preços ou estabelecimentos, nem em seed, placeholder ou dados de exemplo em produção.
- Dados de demonstração existem só para desenvolvimento, marcados com `is_demo = true` ou `NEXT_PUBLIC_SHOW_DEMO_DATA=true`, e a interface mostra o selo **DADOS DE DEMONSTRAÇÃO**. Lugares demo têm "(demo)" no nome.
- Sem conteúdo, mostre um estado vazio honesto ("Ninguém avaliou este lugar ainda"), nunca números ou nota fictícios.
- Notas médias só aparecem quando há avaliações. Não exiba "0,0 estrelas".

## Avaliações

- **Uma avaliação por usuário por lugar** (constraint no banco). Uma segunda tentativa mostra "Você já avaliou este lugar".
- Nota geral de 1 a 5 é obrigatória. Critérios variam por tipo de lugar (`place_categories`) e são opcionais: hotel tem limpeza, atendimento, localização e custo-benefício; restaurante tem comida, atendimento, preço e ambiente; praia tem beleza, limpeza, estrutura e experiência; passeio tem guia e organização.
- A nota do lugar é a média das notas gerais, recalculada por trigger. A nota do destino é a média das avaliações dos seus lugares.
- Estabelecimentos não podem avaliar a si mesmos nem apagar avaliações.

## Publicações (relatos de viagem)

- Texto com no mínimo 10 caracteres. Destino, datas, gasto total, nota da viagem, hotel, lugares visitados e estilo são opcionais, mas incentivados, porque são o que torna o relato útil para planejar.
- Até 10 fotos, com descrição (alt) escrita pelo autor. Gasto sempre em reais, guardado em centavos.
- Só o autor edita ou exclui. Excluir remove fotos, comentários e curtidas.

## Roteiros

- De 1 a 30 dias, até 20 paradas por dia. Cada parada é um lugar cadastrado **ou** um nome livre, com horário e observação opcionais.
- Podem ser públicos ou privados. Privados são invisíveis para os outros, inclusive na busca.
- **Copiar** cria uma cópia privada ("Cópia de ...") na conta de quem copiou, com vínculo `copied_from`. O original não muda.
- Estilos (`travelTags`) alimentam o "Vou viajar".

## Reclamações

- São públicas e ficam na página do lugar. Categoria, título e descrição (mínimo de 20 caracteres) são obrigatórios; fotos (até 5) são opcionais.
- Status: **Aguardando resposta** → **Respondida** (automático, quando um estabelecimento verificado responde) → **Resolvida** ou **Encerrada** (só o autor define). O autor não pode marcar como "Respondida".
- O formulário avisa para não publicar documentos, dados de cartão ou dados de terceiros.

## Estabelecimentos

- Um usuário pode **pedir** para representar um lugar (`business_profiles`, status `pending`). A verificação é manual, feita pela moderação com a service role. Ninguém se autoverifica.
- Só estabelecimentos verificados e vinculados ao lugar respondem reclamações. Respostas aparecem com o selo "Resposta de {nome}".
- Estabelecimentos nunca pagam para alterar nota, ordem ou visibilidade de avaliações.

## "Vou viajar"

- Sem IA no MVP: cruza destino, duração e preferências com roteiros, lugares e relatos da comunidade. Roteiros com duração próxima da viagem vêm primeiro, e depois os com mais estilos em comum. A regra precisa ser explicável ao usuário.
- O plano salvo (datas, pessoas, orçamento, preferências) é privado. Ele é a entrada prevista para uma futura IA de roteiros, mas não prometa IA na interface.

## Social

- Seguir não exige aprovação. Não é possível seguir a si mesmo.
- Notificações: novo seguidor, curtida, comentário, resposta a comentário, roteiro salvo e resposta de estabelecimento. Nunca notifique alguém sobre as próprias ações.
- Salvos são privados; curtidas são públicas em forma de contagem.

## Moderação

- Qualquer usuário logado pode denunciar publicação, comentário, avaliação, perfil ou foto, uma vez por item. As denúncias ficam em `reports` para revisão humana.
- Ainda não existe painel de moderação. Não remova nem esconda conteúdo automaticamente com base em denúncias: isso vira ferramenta de censura entre usuários e concorrentes.

## Escopo atual

Fora do MVP: reservas e pagamentos, anúncios, IA, mensagens diretas, mapa interativo (existe só o placeholder `MapView`) e cadastro de lugares por usuários (hoje o catálogo é mantido pela equipe). Antes de criar algo nessas áreas, confirme com o responsável pelo produto.
