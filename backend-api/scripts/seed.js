// Popula o banco com dados de exemplo para desenvolvimento:
//   - os 3 usuários (um de cada perfil);
//   - as movimentações do extrato api/examples/statement_complete.ofx (já classificadas);
//   - alguns comentários do analista e tarefas delegadas pelo gestor.
//   npm run db:seed        (senha vem de SEED_SENHA em env/.env)
// É seguro rodar várias vezes: nada é duplicado.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import { env } from "../src/config/env.js";
import { pool } from "../src/compartilhado/db.js";
import { lerOfx } from "../src/modulos/importacao/ofx.parser.js";
import { importacaoRepositorio } from "../src/modulos/importacao/importacao.repositorio.js";

if (env.producao) {
  console.error("Seed bloqueado em produção: ele cria usuários com senha conhecida.");
  process.exit(1);
}

// Extrato de exemplo que acompanha o projeto
const extrato = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../api/examples/statement_complete.ofx");

// ON CONFLICT DO NOTHING (abaixo) faz o seed ser seguro de rodar várias vezes
const USUARIOS = [
  { nome: "Ana Analista", email: "analista@ofx.com", perfil: "ANALISTA" },
  { nome: "Enzo Estagiário", email: "estagiario@ofx.com", perfil: "ESTAGIARIO" },
  { nome: "Gabriela Gestora", email: "gestor@ofx.com", perfil: "GESTOR" },
];

// Cria os usuários de exemplo; quem já existe não é alterado
async function semearUsuarios() {
  const hash = await bcrypt.hash(env.seedSenha, 10);
  for (const u of USUARIOS) {
    const { rowCount } = await pool.query(
      "INSERT INTO usuarios (nome, email, senha_hash, perfil) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING",
      [u.nome, u.email, hash, u.perfil]
    );
    console.log(`${rowCount ? "✔ criado " : "• já existe"}  ${u.email}  (${u.perfil})`);
  }
  console.log(`Senha dos usuários novos: ${env.seedSenha}`);
}

// Devolve o id de um usuário de exemplo pelo e-mail
async function idDoUsuario(email) {
  const { rows } = await pool.query("SELECT id FROM usuarios WHERE lower(email) = lower($1)", [email]);
  return rows[0]?.id;
}

// Importa o extrato de exemplo (as duplicadas são puladas pelo índice único)
async function semearMovimentacoes(analistaId) {
  const movimentos = lerOfx(fs.readFileSync(extrato));
  const novas = await importacaoRepositorio.inserirLote(movimentos, analistaId);
  console.log(`✔ movimentações: ${novas} novas de ${movimentos.length} no extrato de exemplo`);
}

// Cria comentários de exemplo, só se a tabela estiver vazia
async function semearComentarios(analistaId) {
  const { rows: existentes } = await pool.query("SELECT 1 FROM comentarios LIMIT 1");
  if (existentes.length) return console.log("• comentários: já existem, nada a fazer");

  // Comenta as duas contas mais recentes que já têm categoria
  const { rows: contas } = await pool.query(
    "SELECT id FROM movimentacoes WHERE categoria <> 'Sem categoria' ORDER BY data_movimentacao DESC, id DESC LIMIT 2"
  );
  const textos = ["Conferido com o comprovante do banco.", "Verificar se o valor mudou em relação ao mês anterior."];
  for (const [i, conta] of contas.entries()) {
    await pool.query(
      "INSERT INTO comentarios (movimentacao_id, usuario_id, texto) VALUES ($1, $2, $3)",
      [conta.id, analistaId, textos[i]]
    );
  }
  console.log(`✔ comentários: ${contas.length} criados`);
}

// Cria tarefas de exemplo delegadas pelo gestor, só se a tabela estiver vazia
async function semearTarefas(gestorId, analistaId, estagiarioId) {
  const { rows: existentes } = await pool.query("SELECT 1 FROM tarefas LIMIT 1");
  if (existentes.length) return console.log("• tarefas: já existem, nada a fazer");

  const tarefas = [
    ["Preciso do balanço do mês", "Fechar o balanço com as contas já classificadas.", "BALANCO", analistaId],
    ["Importar o extrato da conta poupança", "Enviar o OFX mais recente pelo módulo Importação.", "GERAL", estagiarioId],
  ];
  for (const [titulo, descricao, tipo, atribuidoA] of tarefas) {
    await pool.query(
      "INSERT INTO tarefas (titulo, descricao, tipo, atribuido_a, criado_por, prazo) VALUES ($1, $2, $3, $4, $5, current_date + 7)",
      [titulo, descricao, tipo, atribuidoA, gestorId]
    );
  }
  console.log(`✔ tarefas: ${tarefas.length} criadas`);
}

try {
  await semearUsuarios();
  const [analista, estagiario, gestor] = await Promise.all(USUARIOS.map((u) => idDoUsuario(u.email)));
  await semearMovimentacoes(analista);
  await semearComentarios(analista);
  await semearTarefas(gestor, analista, estagiario);
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
