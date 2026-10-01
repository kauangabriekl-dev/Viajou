-- ============================================================================
-- DADOS DE DEMONSTRAÇÃO — SOMENTE NO BANCO H2 LOCAL DE DESENVOLVIMENTO. NUNCA EM PRODUÇÃO.
-- Destinos: cidades reais com coordenadas públicas e textos próprios (is_demo = TRUE).
-- Lugares: TODOS FICTÍCIOS, com "(demo)" no nome. Não correspondem a estabelecimentos reais.
-- Nenhum usuário, avaliação ou publicação é criado.
-- Mesmo conteúdo de supabase/seed.sql (linhas 37 a 65), no dialeto do H2.
-- ============================================================================

INSERT INTO destinations (slug, name, city, state, country, description, latitude, longitude, is_demo, search_key) VALUES
  ('porto-seguro-ba', 'Porto Seguro', 'Porto Seguro', 'BA', 'Brasil', 'Litoral sul da Bahia, com praias extensas, falésias e um centro histórico no alto da cidade.', -16.449700, -39.064700, TRUE, 'porto seguro ba'),
  ('florianopolis-sc', 'Florianópolis', 'Florianópolis', 'SC', 'Brasil', 'Capital catarinense, em grande parte numa ilha, com dezenas de praias e lagoas.', -27.595400, -48.548000, TRUE, 'florianopolis sc'),
  ('rio-de-janeiro-rj', 'Rio de Janeiro', 'Rio de Janeiro', 'RJ', 'Brasil', 'Cidade entre o mar e os morros, com praias urbanas, mirantes e vida cultural intensa.', -22.906800, -43.172900, TRUE, 'rio de janeiro rj'),
  ('gramado-rs', 'Gramado', 'Gramado', 'RS', 'Brasil', 'Cidade da serra gaúcha conhecida pelo clima frio, arquitetura e gastronomia.', -29.378900, -50.873900, TRUE, 'gramado rs'),
  ('fortaleza-ce', 'Fortaleza', 'Fortaleza', 'CE', 'Brasil', 'Capital cearense com sol o ano inteiro, orla movimentada e praias próximas.', -3.731900, -38.526700, TRUE, 'fortaleza ce')
ON CONFLICT DO NOTHING;

INSERT INTO places (destination_id, slug, name, type, description, city, state, latitude, longitude, is_demo, search_key)
SELECT d.id, v.slug, v.name, v.type, v.description, d.city, d.state, d.latitude + v.dlat, d.longitude + v.dlng, TRUE, v.search_key
  FROM (VALUES
    ('porto-seguro-ba', 'pousada-mare-alta-demo-porto-seguro', 'Pousada Maré Alta (demo)', 'hotel', 'Pousada fictícia para testes.', 0.010, 0.004, 'pousada mare alta demo porto seguro'),
    ('porto-seguro-ba', 'restaurante-casa-do-coco-demo-porto-seguro', 'Casa do Coco (demo)', 'restaurant', 'Restaurante fictício para testes.', 0.004, 0.002, 'casa do coco demo porto seguro'),
    ('porto-seguro-ba', 'praia-das-conchas-demo-porto-seguro', 'Praia das Conchas (demo)', 'beach', 'Praia fictícia para testes.', 0.030, 0.008, 'praia das conchas demo porto seguro'),
    ('porto-seguro-ba', 'mirante-historico-demo-porto-seguro', 'Mirante Histórico (demo)', 'attraction', 'Atração fictícia para testes.', -0.002, 0.001, 'mirante historico demo porto seguro'),
    ('florianopolis-sc', 'hotel-lagoa-azul-demo-florianopolis', 'Hotel Lagoa Azul (demo)', 'hotel', 'Hotel fictício para testes.', 0.020, 0.030, 'hotel lagoa azul demo florianopolis'),
    ('florianopolis-sc', 'praia-do-farol-demo-florianopolis', 'Praia do Farol (demo)', 'beach', 'Praia fictícia para testes.', -0.080, 0.040, 'praia do farol demo florianopolis'),
    ('florianopolis-sc', 'passeio-de-barco-ilha-demo-florianopolis', 'Passeio de Barco pela Ilha (demo)', 'tour', 'Passeio fictício para testes.', 0.010, 0.010, 'passeio de barco pela ilha demo florianopolis'),
    ('rio-de-janeiro-rj', 'bistro-do-morro-demo-rio-de-janeiro', 'Bistrô do Morro (demo)', 'restaurant', 'Restaurante fictício para testes.', -0.010, -0.010, 'bistro do morro demo rio de janeiro'),
    ('rio-de-janeiro-rj', 'trilha-do-mirante-demo-rio-de-janeiro', 'Trilha do Mirante (demo)', 'attraction', 'Atração fictícia para testes.', -0.020, -0.030, 'trilha do mirante demo rio de janeiro'),
    ('gramado-rs', 'chale-da-serra-demo-gramado', 'Chalé da Serra (demo)', 'hotel', 'Hospedagem fictícia para testes.', 0.005, 0.005, 'chale da serra demo gramado'),
    ('gramado-rs', 'cafe-colonial-pinheiro-demo-gramado', 'Café Colonial Pinheiro (demo)', 'restaurant', 'Restaurante fictício para testes.', 0.002, -0.003, 'cafe colonial pinheiro demo gramado'),
    ('fortaleza-ce', 'barraca-sol-nascente-demo-fortaleza', 'Barraca Sol Nascente (demo)', 'restaurant', 'Barraca de praia fictícia para testes.', 0.010, 0.020, 'barraca sol nascente demo fortaleza'),
    ('fortaleza-ce', 'praia-das-dunas-demo-fortaleza', 'Praia das Dunas (demo)', 'beach', 'Praia fictícia para testes.', 0.040, 0.060, 'praia das dunas demo fortaleza')
  ) AS v(dest_slug, slug, name, type, description, dlat, dlng, search_key)
  JOIN destinations d ON d.slug = v.dest_slug
ON CONFLICT DO NOTHING;

-- Estilos dos destinos de demonstração (características conhecidas de cada cidade).
INSERT INTO destination_styles (destination_id, style)
SELECT d.id, v.style
  FROM (VALUES
    ('porto-seguro-ba', 'praia'), ('porto-seguro-ba', 'historico'),
    ('florianopolis-sc', 'praia'), ('florianopolis-sc', 'trilha'), ('florianopolis-sc', 'floresta'),
    ('rio-de-janeiro-rj', 'praia'), ('rio-de-janeiro-rj', 'montanha'), ('rio-de-janeiro-rj', 'trilha'), ('rio-de-janeiro-rj', 'cidade'),
    ('gramado-rs', 'frio'), ('gramado-rs', 'montanha'), ('gramado-rs', 'gastronomia'),
    ('fortaleza-ce', 'praia'), ('fortaleza-ce', 'cidade')
  ) AS v(dest_slug, style)
  JOIN destinations d ON d.slug = v.dest_slug
ON CONFLICT DO NOTHING;
