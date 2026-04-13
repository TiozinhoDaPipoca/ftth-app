-- ═══════════════════════════════════════
-- CÓDIGOS DE CONVITE
-- Rode este SQL no banco de dados
-- ═══════════════════════════════════════

CREATE TABLE IF NOT EXISTS codigos_convite (
  id SERIAL PRIMARY KEY,
  codigo VARCHAR(50) UNIQUE NOT NULL,
  tipo VARCHAR(20) NOT NULL DEFAULT 'tecnico',  -- 'tecnico' ou 'empresa'
  usado_por INTEGER,
  usado_em TIMESTAMP,
  criado_por INTEGER,
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMP DEFAULT NOW()
);

-- Códigos iniciais pra você distribuir
INSERT INTO codigos_convite (codigo, tipo) VALUES
  ('LAMPEJO-TEC-2026', 'tecnico'),
  ('LAMPEJO-TEC-BETA01', 'tecnico'),
  ('LAMPEJO-TEC-BETA02', 'tecnico'),
  ('LAMPEJO-TEC-BETA03', 'tecnico'),
  ('LAMPEJO-TEC-BETA04', 'tecnico'),
  ('LAMPEJO-TEC-BETA05', 'tecnico'),
  ('LAMPEJO-EMP-2026', 'empresa'),
  ('LAMPEJO-EMP-BETA01', 'empresa'),
  ('LAMPEJO-EMP-BETA02', 'empresa'),
  ('LAMPEJO-MASTER-2026', 'tecnico'),
  ('LAMPEJO-MASTER-2027', 'empresa')
ON CONFLICT (codigo) DO NOTHING;
