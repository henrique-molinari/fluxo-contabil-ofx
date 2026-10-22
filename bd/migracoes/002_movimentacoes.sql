-- Movimentações bancárias. A tabela já existia na versão em Python,
-- por isso tudo aqui é "IF NOT EXISTS" e os dados antigos são preservados.

CREATE TABLE IF NOT EXISTS movimentacoes (
    id                SERIAL PRIMARY KEY,
    data_movimentacao DATE,
    valor             NUMERIC(15,2),
    descricao         VARCHAR(255)
);

-- Colunas novas: categoria e auditoria (quem criou/alterou e quando)
ALTER TABLE movimentacoes ADD COLUMN IF NOT EXISTS categoria    VARCHAR(50) DEFAULT 'Sem categoria';
ALTER TABLE movimentacoes ADD COLUMN IF NOT EXISTS criado_por   INTEGER REFERENCES usuarios (id) ON DELETE SET NULL;
ALTER TABLE movimentacoes ADD COLUMN IF NOT EXISTS alterado_por INTEGER REFERENCES usuarios (id) ON DELETE SET NULL;
ALTER TABLE movimentacoes ADD COLUMN IF NOT EXISTS criado_em    TIMESTAMPTZ DEFAULT now();
ALTER TABLE movimentacoes ADD COLUMN IF NOT EXISTS alterado_em  TIMESTAMPTZ;

-- Não deixa gravar duas movimentações iguais (data + valor + descrição)
CREATE UNIQUE INDEX IF NOT EXISTS ux_movimentacoes
    ON movimentacoes (data_movimentacao, valor, descricao);
