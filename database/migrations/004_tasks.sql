-- Tarefas que o gestor delega (ex.: pedir um balanço) e a equipe acompanha.

CREATE TABLE IF NOT EXISTS tarefas (
    id            SERIAL PRIMARY KEY,
    titulo        VARCHAR(160) NOT NULL,
    descricao     TEXT,
    -- GERAL = tarefa comum; BALANCO = pedido de balanço
    tipo          VARCHAR(20)  NOT NULL DEFAULT 'GERAL' CHECK (tipo IN ('GERAL', 'BALANCO')),
    status        VARCHAR(20)  NOT NULL DEFAULT 'PENDENTE'
                  CHECK (status IN ('PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDA')),
    -- criado_por = gestor que delegou; atribuido_a = quem vai executar
    criado_por    INTEGER      NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
    atribuido_a   INTEGER      NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
    prazo         DATE,
    criado_em     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    concluido_em  TIMESTAMPTZ
);

-- Índice para "minhas tarefas" filtradas por andamento
CREATE INDEX IF NOT EXISTS ix_tarefas_atribuido ON tarefas (atribuido_a, status);
