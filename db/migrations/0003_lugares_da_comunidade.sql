-- ============================================================================
-- VIAJOU — Lugares cadastrados pelos viajantes + praias de cada relato.
-- Até aqui só a equipe cadastrava lugares. Agora quem publica uma viagem pode
-- adicionar um lugar que ainda não existe; ele fica marcado como "da comunidade"
-- (is_community) e com o autor (created_by), para ser revisado e diferenciado.
-- ============================================================================

ALTER TABLE places ADD COLUMN created_by UUID REFERENCES profiles (id) ON DELETE SET NULL;
ALTER TABLE places ADD COLUMN is_community BOOLEAN DEFAULT FALSE NOT NULL;
CREATE INDEX places_search_idx ON places (search_key);

-- Em relatos de praia: a praia favorita, a que a pessoa recomenda e a que não voltaria.
CREATE TABLE post_beach_picks (
  post_id UUID NOT NULL REFERENCES posts (id) ON DELETE CASCADE,
  kind VARCHAR(20) NOT NULL CHECK (kind IN ('favorita', 'recomenda', 'nao_voltaria')),
  place_id UUID NOT NULL REFERENCES places (id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, kind)
);
CREATE INDEX post_beach_picks_place_idx ON post_beach_picks (place_id, kind);
