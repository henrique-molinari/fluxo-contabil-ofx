-- Um usuário de teste de cada perfil, para experimentar as funcionalidades.
-- Senha de todos: Mudar@123   (apenas desenvolvimento; troque ou desative antes de ir para produção)
-- Se o e-mail já existir (ex.: criado pelo db:seed), não altera nada.

INSERT INTO usuarios (nome, email, senha_hash, perfil) VALUES
    ('Ana Analista',     'analista@ofx.com',   '$2a$10$ujW4wW44W9dEiCwc6mjPnem3BvtAbMWwGukVVPKBQ/JgRJQHR4Kf.', 'ANALISTA'),
    ('Enzo Estagiário',  'estagiario@ofx.com', '$2a$10$ujW4wW44W9dEiCwc6mjPnem3BvtAbMWwGukVVPKBQ/JgRJQHR4Kf.', 'ESTAGIARIO'),
    ('Gabriela Gestora', 'gestor@ofx.com',     '$2a$10$ujW4wW44W9dEiCwc6mjPnem3BvtAbMWwGukVVPKBQ/JgRJQHR4Kf.', 'GESTOR')
ON CONFLICT DO NOTHING;
