-- ============================================================================
-- DADOS DE DEMONSTRAÇÃO — SOMENTE DESENVOLVIMENTO
-- Destinos: cidades reais com coordenadas públicas e textos próprios.
-- Lugares: TODOS FICTÍCIOS (is_demo = true). Não correspondem a estabelecimentos reais.
-- Nenhum usuário, avaliação ou publicação é criado: esse conteúdo vem de pessoas reais.
-- ============================================================================

-- Critérios de avaliação
insert into public.review_categories (key, label) values
  ('service', 'Atendimento'),
  ('value', 'Custo-benefício'),
  ('cleanliness', 'Limpeza'),
  ('location', 'Localização'),
  ('experience', 'Experiência'),
  ('food', 'Comida'),
  ('price', 'Preço'),
  ('ambience', 'Ambiente'),
  ('beauty', 'Beleza'),
  ('infrastructure', 'Estrutura'),
  ('guide', 'Guia'),
  ('organization', 'Organização')
on conflict (key) do nothing;

insert into public.place_categories (place_type, review_category_id, position)
select v.place_type::public.place_type, rc.id, v.position
  from (values
    ('hotel', 'cleanliness', 1), ('hotel', 'service', 2), ('hotel', 'location', 3), ('hotel', 'value', 4),
    ('restaurant', 'food', 1), ('restaurant', 'service', 2), ('restaurant', 'price', 3), ('restaurant', 'ambience', 4),
    ('beach', 'beauty', 1), ('beach', 'cleanliness', 2), ('beach', 'infrastructure', 3), ('beach', 'experience', 4),
    ('attraction', 'experience', 1), ('attraction', 'value', 2), ('attraction', 'infrastructure', 3),
    ('tour', 'guide', 1), ('tour', 'organization', 2), ('tour', 'value', 3), ('tour', 'experience', 4),
    ('other', 'experience', 1), ('other', 'value', 2)
  ) as v(place_type, key, position)
  join public.review_categories rc on rc.key = v.key
on conflict do nothing;

-- Destinos
insert into public.destinations (slug, name, city, state, country, description, latitude, longitude, is_demo) values
  ('porto-seguro-ba', 'Porto Seguro', 'Porto Seguro', 'BA', 'Brasil', 'Litoral sul da Bahia, com praias extensas, falésias e um centro histórico no alto da cidade.', -16.449700, -39.064700, true),
  ('florianopolis-sc', 'Florianópolis', 'Florianópolis', 'SC', 'Brasil', 'Capital catarinense, em grande parte numa ilha, com dezenas de praias e lagoas.', -27.595400, -48.548000, true),
  ('rio-de-janeiro-rj', 'Rio de Janeiro', 'Rio de Janeiro', 'RJ', 'Brasil', 'Cidade entre o mar e os morros, com praias urbanas, mirantes e vida cultural intensa.', -22.906800, -43.172900, true),
  ('gramado-rs', 'Gramado', 'Gramado', 'RS', 'Brasil', 'Cidade da serra gaúcha conhecida pelo clima frio, arquitetura e gastronomia.', -29.378900, -50.873900, true),
  ('fortaleza-ce', 'Fortaleza', 'Fortaleza', 'CE', 'Brasil', 'Capital cearense com sol o ano inteiro, orla movimentada e praias próximas.', -3.731900, -38.526700, true)
on conflict (slug) do nothing;

-- Lugares fictícios
insert into public.places (destination_id, slug, name, type, description, city, state, latitude, longitude, is_demo)
select d.id, v.slug, v.name, v.type::public.place_type, v.description, d.city, d.state, d.latitude + v.dlat, d.longitude + v.dlng, true
  from (values
    ('porto-seguro-ba', 'pousada-mare-alta-demo-porto-seguro', 'Pousada Maré Alta (demo)', 'hotel', 'Pousada fictícia para testes.', 0.010, 0.004),
    ('porto-seguro-ba', 'restaurante-casa-do-coco-demo-porto-seguro', 'Casa do Coco (demo)', 'restaurant', 'Restaurante fictício para testes.', 0.004, 0.002),
    ('porto-seguro-ba', 'praia-das-conchas-demo-porto-seguro', 'Praia das Conchas (demo)', 'beach', 'Praia fictícia para testes.', 0.030, 0.008),
    ('porto-seguro-ba', 'mirante-historico-demo-porto-seguro', 'Mirante Histórico (demo)', 'attraction', 'Atração fictícia para testes.', -0.002, 0.001),
    ('florianopolis-sc', 'hotel-lagoa-azul-demo-florianopolis', 'Hotel Lagoa Azul (demo)', 'hotel', 'Hotel fictício para testes.', 0.020, 0.030),
    ('florianopolis-sc', 'praia-do-farol-demo-florianopolis', 'Praia do Farol (demo)', 'beach', 'Praia fictícia para testes.', -0.080, 0.040),
    ('florianopolis-sc', 'passeio-de-barco-ilha-demo-florianopolis', 'Passeio de Barco pela Ilha (demo)', 'tour', 'Passeio fictício para testes.', 0.010, 0.010),
    ('rio-de-janeiro-rj', 'bistro-do-morro-demo-rio-de-janeiro', 'Bistrô do Morro (demo)', 'restaurant', 'Restaurante fictício para testes.', -0.010, -0.010),
    ('rio-de-janeiro-rj', 'trilha-do-mirante-demo-rio-de-janeiro', 'Trilha do Mirante (demo)', 'attraction', 'Atração fictícia para testes.', -0.020, -0.030),
    ('gramado-rs', 'chale-da-serra-demo-gramado', 'Chalé da Serra (demo)', 'hotel', 'Hospedagem fictícia para testes.', 0.005, 0.005),
    ('gramado-rs', 'cafe-colonial-pinheiro-demo-gramado', 'Café Colonial Pinheiro (demo)', 'restaurant', 'Restaurante fictício para testes.', 0.002, -0.003),
    ('fortaleza-ce', 'barraca-sol-nascente-demo-fortaleza', 'Barraca Sol Nascente (demo)', 'restaurant', 'Barraca de praia fictícia para testes.', 0.010, 0.020),
    ('fortaleza-ce', 'praia-das-dunas-demo-fortaleza', 'Praia das Dunas (demo)', 'beach', 'Praia fictícia para testes.', 0.040, 0.060)
  ) as v(dest_slug, slug, name, type, description, dlat, dlng)
  join public.destinations d on d.slug = v.dest_slug
on conflict (slug) do nothing;
