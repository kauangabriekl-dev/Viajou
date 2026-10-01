-- ============================================================================
-- VIAJOU — Estilos de destino (praia, frio e neve, montanha, trilha, floresta...).
-- Um destino tem estilos por três caminhos (combinados pela aplicação em lib/queries.ts):
--  1. catálogo: marcados pela equipe nesta tabela;
--  2. conteúdo: lugares de praia, achadinhos de trilha/cachoeira etc.;
--  3. votos: quem avalia o destino marca "bom para" (destination_reviews.styles).
-- ============================================================================

CREATE TABLE destination_styles (
  destination_id UUID NOT NULL REFERENCES destinations (id) ON DELETE CASCADE,
  style VARCHAR(20) NOT NULL CHECK (style IN ('praia', 'frio', 'montanha', 'trilha', 'floresta', 'cachoeira', 'cidade', 'historico', 'gastronomia', 'aventura')),
  PRIMARY KEY (destination_id, style)
);
CREATE INDEX destination_styles_style_idx ON destination_styles (style);

-- "Bom para": estilos marcados por quem avaliou o destino, como texto "praia,trilha".
ALTER TABLE destination_reviews ADD COLUMN styles VARCHAR(200);
