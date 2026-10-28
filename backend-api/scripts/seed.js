// Popula o banco com dados de exemplo para desenvolvimento:
//   - os 3 usuários (um de cada perfil);
//   - as movimentações do extrato api/examples/statement_complete.ofx (já classificadas);
//   - alguns comentários do analista e tarefas delegadas pelo gestor.
//   npm run db:seed        (senha vem de SEED_SENHA em env/.env)
// É seguro rodar várias vezes: nada é duplicado. Tudo é gravado pelos models do Sequelize.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import { Op } from "sequelize";
import { env } from "../src/config/env.js";
import { sequelize } from "../src/shared/db.js";
import { Comentario, Movimentacao, Tarefa } from "../src/shared/models/index.js";
import { authRepositorio } from "../src/modules/auth/auth.repository.js";
import { usuariosRepositorio } from "../src/modules/users/users.repository.js";
import { lerOfx } from "../src/modules/import/ofx.parser.js";
import { importacaoRepositorio } from "../src/modules/import/import.repository.js";
import { tarefasRepositorio } from "../src/modules/tasks/tasks.repository.js";

if (env.producao) {
  console.error("Seed bloqueado em produção: ele cria usuários com senha conhecida.");
  process.exit(1);
}

// Extrato de exemplo que acompanha o projeto
const extrato = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../api/examples/statement_complete.ofx");

// Quem já existe não é alterado, por isso o seed é seguro de rodar várias vezes
const USUARIOS = [
  { nome: "Ana Analista", email: "analista@ofx.com", perfil: "ANALISTA" },
  { nome: "Enzo Estagiário", email: "estagiario@ofx.com", perfil: "ESTAGIARIO" },
  { nome: "Gabriela Gestora", email: "gestor@ofx.com", perfil: "GESTOR" },
];

// Cria os usuários de exemplo; quem já existe não é alterado
async function semearUsuarios() {
  const senhaHash = await bcrypt.hash(env.seedSenha, 10);
  for (const u of USUARIOS) {
    const existente = await authRepositorio.buscarUsuarioPorEmail(u.email);
    if (!existente) await usuariosRepositorio.criar({ ...u, senhaHash });
    console.log(`${existente ? "• já existe" : "✔ criado "}  ${u.email}  (${u.perfil})`);
  }
  console.log(`Senha dos usuários novos: ${env.seedSenha}`);
}

// Devolve o id de um usuário de exemplo pelo e-mail
async function idDoUsuario(email) {
  return (await authRepositorio.buscarUsuarioPorEmail(email))?.id;
}

// Importa o extrato de exemplo (as duplicadas são puladas pelo índice único)
async function semearMovimentacoes(analistaId) {
  const movimentos = lerOfx(fs.readFileSync(extrato));
  const novas = await importacaoRepositorio.inserirLote(movimentos, analistaId);
  console.log(`✔ movimentações: ${novas} novas de ${movimentos.length} no extrato de exemplo`);
}

// Cria comentários de exemplo, só se a tabela estiver vazia
async function semearComentarios(analistaId) {
  if ((await Comentario.count()) > 0) return console.log("• comentários: já existem, nada a fazer");

  // Comenta as duas contas mais recentes que já têm categoria
  const contas = await Movimentacao.findAll({
    attributes: ["id"],
    where: { categoria: { [Op.ne]: "Sem categoria" } },
    order: [["data_movimentacao", "DESC"], ["id", "DESC"]],
    limit: 2,
    raw: true,
  });
  const textos = ["Conferido com o comprovante do banco.", "Verificar se o valor mudou em relação ao mês anterior."];
  for (const [i, conta] of contas.entries()) {
    await Comentario.create({ movimentacao_id: conta.id, usuario_id: analistaId, texto: textos[i] });
  }
  console.log(`✔ comentários: ${contas.length} criados`);
}

// Cria tarefas de exemplo delegadas pelo gestor, só se a tabela estiver vazia
async function semearTarefas(gestorId, analistaId, estagiarioId) {
  if ((await Tarefa.count()) > 0) return console.log("• tarefas: já existem, nada a fazer");

  // Prazo de uma semana a partir de hoje, no formato AAAA-MM-DD
  const prazo = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const tarefas = [
    { titulo: "Preciso do balanço do mês", descricao: "Fechar o balanço com as contas já classificadas.", tipo: "BALANCO", atribuido_a: analistaId },
    { titulo: "Importar o extrato da conta poupança", descricao: "Enviar o OFX mais recente pelo módulo Importação.", tipo: "GERAL", atribuido_a: estagiarioId },
  ];
  for (const tarefa of tarefas) await tarefasRepositorio.criar({ ...tarefa, prazo }, gestorId);
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
  await sequelize.close();
}
