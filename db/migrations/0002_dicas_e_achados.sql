-- ============================================================================
-- VIAJOU — Notas e dicas de destino + Achadinhos.
-- ============================================================================

-- Nota do destino como um todo (além das notas de cada lugar). Uma por pessoa por destino.
-- best_months: meses em que a pessoa recomenda ir, como texto "1,7,12" (o H2 não aceita
-- arrays por parâmetro; a aplicação valida e monta). daily_cost_cents: gasto médio por dia, por pessoa.
CREATE TABLE destination_reviews (
  id UUID DEFAULT RANDOM_UUID() PRIMARY KEY,
  destination_id UUID NOT NULL REFERENCES destinations (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body VARCHAR(3000) NOT NULL CHECK (CHAR_LENGTH(body) >= 10),
  visited_month SMALLINT CHECK (visited_month BETWEEN 1 AND 12),
  visited_year SMALLINT CHECK (visited_year BETWEEN 1950 AND 2100),
  best_months VARCHAR(40),
  daily_cost_cents INTEGER CHECK (daily_cost_cents >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  UNIQUE (destination_id, user_id)
);
CREATE INDEX destination_reviews_dest_idx ON destination_reviews (destination_id, created_at DESC);

-- Dicas por assunto: melhor época, café da manhã, onde comer, onde ficar, passeios, custo, transporte.
CREATE TABLE destination_tips (
  id UUID DEFAULT RANDOM_UUID() PRIMARY KEY,
  destination_id UUID NOT NULL REFERENCES destinations (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  topic VARCHAR(20) NOT NULL CHECK (topic IN ('melhor_epoca', 'cafe_da_manha', 'onde_comer', 'onde_ficar', 'passeios', 'custo', 'transporte')),
  title VARCHAR(120) NOT NULL CHECK (CHAR_LENGTH(title) >= 3),
  body VARCHAR(1500) NOT NULL CHECK (CHAR_LENGTH(body) >= 10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX destination_tips_dest_idx ON destination_tips (destination_id, topic, created_at DESC);

-- "Foi útil": um voto por pessoa por dica. A ordem das dicas usa esses votos.
CREATE TABLE destination_tip_votes (
  tip_id UUID NOT NULL REFERENCES destination_tips (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (tip_id, user_id)
);

-- Achadinhos: lugar especial com foto e localização exata, para outros viajantes irem também.
CREATE TABLE achados (
  id UUID DEFAULT RANDOM_UUID() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  destination_id UUID REFERENCES destinations (id) ON DELETE SET NULL,
  title VARCHAR(120) NOT NULL CHECK (CHAR_LENGTH(title) >= 5),
  body VARCHAR(2000) NOT NULL CHECK (CHAR_LENGTH(body) >= 10),
  category VARCHAR(20) NOT NULL CHECK (category IN ('praia', 'mirante', 'trilha', 'cachoeira', 'comida', 'cafe', 'compras', 'cultura', 'outro')),
  latitude NUMERIC(9, 6) NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude NUMERIC(9, 6) NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  location_name VARCHAR(200),
  tip VARCHAR(500),
  search_key VARCHAR(400),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX achados_feed_idx ON achados (created_at DESC);
CREATE INDEX achados_destination_idx ON achados (destination_id, created_at DESC);
CREATE INDEX achados_geo_idx ON achados (latitude, longitude);

CREATE TABLE achado_photos (
  id UUID DEFAULT RANDOM_UUID() PRIMARY KEY,
  achado_id UUID NOT NULL REFERENCES achados (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  storage_path VARCHAR(300) NOT NULL UNIQUE,
  alt VARCHAR(200),
  position SMALLINT DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX achado_photos_achado_idx ON achado_photos (achado_id, position);

CREATE TABLE achado_saves (
  achado_id UUID NOT NULL REFERENCES achados (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (achado_id, user_id)
);
