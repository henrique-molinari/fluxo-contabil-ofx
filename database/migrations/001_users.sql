-- Usuários do sistema e tokens de renovação (autenticação).
-- O perfil define o que cada pessoa pode fazer (autorização), veja backend-api/src/config/permissions.js.

CREATE TABLE IF NOT EXISTS usuarios (
    id          SERIAL PRIMARY KEY,
    nome        VARCHAR(120) NOT NULL,
    email       VARCHAR(160) NOT NULL,
    senha_hash  VARCHAR(100) NOT NULL,
    perfil      VARCHAR(20)  NOT NULL CHECK (perfil IN ('ANALISTA', 'ESTAGIARIO', 'GESTOR')),
    ativo       BOOLEAN      NOT NULL DEFAULT TRUE,
    criado_em   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- e-mail único sem diferenciar maiúsculas de minúsculas
CREATE UNIQUE INDEX IF NOT EXISTS ux_usuarios_email ON usuarios (lower(email));

-- Guardamos só o hash do refresh token, nunca o token em si.
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id          SERIAL PRIMARY KEY,
    usuario_id  INTEGER     NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
    token_hash  CHAR(64)    NOT NULL UNIQUE,
    expira_em   TIMESTAMPTZ NOT NULL,
    revogado_em TIMESTAMPTZ,
    criado_em   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_refresh_tokens_usuario ON refresh_tokens (usuario_id);
