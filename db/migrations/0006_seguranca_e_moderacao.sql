-- ============================================================================
-- VIAJOU — Segurança e moderação.
--  1. rate_limits: contador por janela de tempo (login, cadastro e outras ações).
--  2. Moderação de conteúdo da comunidade: lugares e achadinhos podem ser denunciados;
--     com 3 denúncias saem do ar (hidden_at) até um administrador revisar.
--  3. Nome de reserva nas paradas de roteiro: guarda o nome do lugar na própria parada,
--     para o roteiro não quebrar se o lugar for apagado.
-- ============================================================================

CREATE TABLE rate_limits (
  bucket VARCHAR(200) PRIMARY KEY,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL,
  hits INTEGER NOT NULL
);

ALTER TABLE profiles ADD COLUMN is_admin BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE places ADD COLUMN hidden_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE achados ADD COLUMN hidden_at TIMESTAMP WITH TIME ZONE;

CREATE TABLE community_reports (
  id UUID DEFAULT RANDOM_UUID() PRIMARY KEY,
  reporter_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('place', 'achado')),
  target_id UUID NOT NULL,
  reason VARCHAR(30) NOT NULL CHECK (reason IN ('spam', 'offensive', 'false_information', 'fraud', 'inappropriate', 'other')),
  details VARCHAR(1000),
  status VARCHAR(20) DEFAULT 'open' NOT NULL CHECK (status IN ('open', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  UNIQUE (reporter_id, target_type, target_id)
);
CREATE INDEX community_reports_target_idx ON community_reports (target_type, target_id);

-- Paradas que já apontam para um lugar ganham o nome dele como reserva.
UPDATE itinerary_places ip
   SET custom_name = (SELECT LEFT(p.name, 120) FROM places p WHERE p.id = ip.place_id)
 WHERE ip.custom_name IS NULL AND ip.place_id IS NOT NULL;
