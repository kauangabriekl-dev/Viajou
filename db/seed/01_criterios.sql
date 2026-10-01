-- Critérios de avaliação e quais valem para cada tipo de lugar. Obrigatório em qualquer ambiente.
-- Mesmo conteúdo de supabase/seed.sql (linhas 8 a 35), no dialeto do H2. Pode rodar mais de uma vez.

INSERT INTO review_categories ("key", label) VALUES
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
ON CONFLICT DO NOTHING;

INSERT INTO place_categories (place_type, review_category_id, position)
SELECT v.place_type, rc.id, v.position
  FROM (VALUES
    ('hotel', 'cleanliness', 1), ('hotel', 'service', 2), ('hotel', 'location', 3), ('hotel', 'value', 4),
    ('restaurant', 'food', 1), ('restaurant', 'service', 2), ('restaurant', 'price', 3), ('restaurant', 'ambience', 4),
    ('beach', 'beauty', 1), ('beach', 'cleanliness', 2), ('beach', 'infrastructure', 3), ('beach', 'experience', 4),
    ('attraction', 'experience', 1), ('attraction', 'value', 2), ('attraction', 'infrastructure', 3),
    ('tour', 'guide', 1), ('tour', 'organization', 2), ('tour', 'value', 3), ('tour', 'experience', 4),
    ('other', 'experience', 1), ('other', 'value', 2)
  ) AS v(place_type, k, position)
  JOIN review_categories rc ON rc."key" = v.k
ON CONFLICT DO NOTHING;
