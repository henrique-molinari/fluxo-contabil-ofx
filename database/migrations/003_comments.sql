-- Comentários do analista fiscal em cada movimentação.

CREATE TABLE IF NOT EXISTS comentarios (
    id              SERIAL PRIMARY KEY,
    movimentacao_id INTEGER     NOT NULL REFERENCES movimentacoes (id) ON DELETE CASCADE,
    usuario_id      INTEGER     NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
    texto           TEXT        NOT NULL,
    criado_em       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índice para listar rápido os comentários de uma conta
CREATE INDEX IF NOT EXISTS ix_comentarios_movimentacao ON comentarios (movimentacao_id);
