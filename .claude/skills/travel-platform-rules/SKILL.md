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

## Lugares da comunidade

- Ao publicar uma viagem, a pessoa escreve ou busca os lugares visitados. Se o lugar não existe, é criado como **lugar da comunidade** (`places.is_community = true`, `created_by`). Antes de criar, o sistema reaproveita um lugar com o mesmo nome (sem acento) no mesmo destino, para não duplicar.
- Em relatos de praia: "Qual praia você mais gostou?", "Qual você recomenda?" e "Qual você não voltaria?" (`post_beach_picks`). "Não voltaria" pede o motivo no relato: é opinião de viajante, não acusação a estabelecimento.
- Lugares da comunidade ainda não têm revisão: quando houver painel de moderação, eles entram nele.

## Notas e dicas de destino

- Além da nota de cada lugar, existe a **nota do destino** (uma por pessoa), com os meses em que a pessoa recomenda ir e o gasto por dia, por pessoa. O resumo mostra média, meses mais recomendados e a **mediana** do gasto, sempre com "de quantos relatos". Sem avaliações, nada de números.
- **Dicas por assunto**: melhor época, café da manhã, onde comer, onde ficar, passeios, custo e transporte. "Foi útil" ordena as dicas; ninguém vota na própria.

## Achadinhos

- Lugar especial com foto (pelo menos uma) e **localização exata**, marcada no mapa ou pelo GPS. O nome do local e o destino mais próximo (até 80 km) são calculados no servidor.
- A localização é pública por escolha da pessoa: o formulário avisa para não marcar casas. A localização gravada dentro das fotos (EXIF/XMP) é sempre apagada.
- "Como chegar" abre a rota no Google Maps; "Salvar para ir" guarda na conta.

## Roteiro sugerido pela comunidade

- Montado na hora (`lib/suggested-itinerary.ts`) com os sinais reais: notas (média com peso, para uma nota sozinha não vencer muitas), recomendações e favoritas de praia, "não voltaria" (desconta e pode excluir), dicas votadas, achadinhos salvos e uso em roteiros públicos. Cada parada mostra **por que** está ali.
- Sem dados suficientes, não sugere nada e convida a avaliar. Nunca é apresentado como viagem de uma pessoa: o selo é "Roteiro sugerido pela comunidade". Salvar cria uma cópia privada editável.
- Referência de formato: guias de destino (seções quando ir, onde ficar, onde comer, passeios). Não copie texto de nenhum guia.

## Escopo atual

Fora do MVP: reservas e pagamentos, anúncios, IA generativa, mensagens diretas e painel de moderação. Antes de criar algo nessas áreas, confirme com o responsável pelo produto.
