// Cria os 3 usuários de exemplo (um de cada perfil). Se já existirem, não mexe.
//   npm run db:seed        (senha vem de SEED_SENHA em env/.env)
import bcrypt from "bcryptjs";
import { env } from "../src/config/env.js";
import { pool } from "../src/compartilhado/db.js";

if (env.producao) {
  console.error("Seed bloqueado em produção: ele cria usuários com senha conhecida.");
  process.exit(1);
}

// ON CONFLICT DO NOTHING (abaixo) faz o seed ser seguro de rodar várias vezes
const USUARIOS = [
  { nome: "Ana Analista", email: "analista@ofx.com", perfil: "ANALISTA" },
  { nome: "Enzo Estagiário", email: "estagiario@ofx.com", perfil: "ESTAGIARIO" },
  { nome: "Gabriela Gestora", email: "gestor@ofx.com", perfil: "GESTOR" },
];

try {
  const hash = await bcrypt.hash(env.seedSenha, 10);
  for (const u of USUARIOS) {
    const { rowCount } = await pool.query(
      "INSERT INTO usuarios (nome, email, senha_hash, perfil) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING",
      [u.nome, u.email, hash, u.perfil]
    );
    console.log(`${rowCount ? "✔ criado " : "• já existe"}  ${u.email}  (${u.perfil})`);
  }
  console.log(`Senha dos usuários novos: ${env.seedSenha}`);
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
