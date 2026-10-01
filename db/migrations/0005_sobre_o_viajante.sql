-- ============================================================================
-- VIAJOU — "Conte sobre você" no Vou viajar: texto livre da pessoa (ritmo, com quem
-- viaja, do que gosta e do que não gosta) usado para montar o roteiro personalizado.
-- ============================================================================

ALTER TABLE trip_plans ADD COLUMN about VARCHAR(2000);
