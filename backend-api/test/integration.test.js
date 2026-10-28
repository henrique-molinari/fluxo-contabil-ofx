// Testes da API de ponta a ponta (sobem o app e usam o PostgreSQL de verdade).
//   npm run test:integracao
// ATENÇÃO: eles apagam movimentações e tarefas. Por segurança só rodam se o nome do banco
// terminar com "_teste" (ex.: PGDATABASE=ofx_teste). Rode db:migrar nesse banco antes.
import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

process.env.NODE_ENV = "test";
process.env.JWT_SEGREDO ??= "segredo-so-para-testes-de-integracao";

const seguro = (process.env.PGDATABASE || "").endsWith("_teste");
const { criarApp } = await import("../src/app.js");
const { sequelize } = await import("../src/shared/db.js");
const { Movimentacao, Tarefa, Usuario } = await import("../src/shared/models/index.js");
const bcrypt = (await import("bcryptjs")).default;

const exemplos = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../api/examples");
const SENHA = "Teste@12345";
const contas = {
  analista: { email: "t.analista@teste.com", perfil: "ANALISTA" },
  estagiario: { email: "t.estagiario@teste.com", perfil: "ESTAGIARIO" },
  gestor: { email: "t.gestor@teste.com", perfil: "GESTOR" },
};
let servidor, base;
const tokens = {};

const chamar = async (quem, metodo, url, corpo, extra = {}) => {
  const headers = { ...extra.headers };
  if (quem) headers.Authorization = `Bearer ${tokens[quem]}`;
  if (corpo && !(corpo instanceof FormData)) headers["Content-Type"] = "application/json";
  const r = await fetch(base + url, {
    method: metodo,
    headers,
    body: corpo instanceof FormData ? corpo : corpo ? JSON.stringify(corpo) : undefined,
  });
  const tipo = r.headers.get("content-type") || "";
  const dados = tipo.includes("json") ? await r.json() : Buffer.from(await r.arrayBuffer());
  return { status: r.status, dados, headers: r.headers };
};

const formOfx = (arquivo = "statement.ofx") => {
  const f = new FormData();
  f.append("arquivo", new Blob([fs.readFileSync(path.join(exemplos, arquivo))]), arquivo);
  return f;
};

before(async () => {
  if (!seguro) return;
  servidor = criarApp().listen(0);
  base = `http://127.0.0.1:${servidor.address().port}/api`;
  const hash = await bcrypt.hash(SENHA, 4);
  for (const [nome, c] of Object.entries(contas)) {
    const [rows] = await sequelize.query(
      `INSERT INTO usuarios (nome, email, senha_hash, perfil) VALUES ($1, $2, $3, $4)
       ON CONFLICT (lower(email)) DO UPDATE SET senha_hash = $3, perfil = $4, ativo = true RETURNING id`,
      { bind: [`Teste ${nome}`, c.email, hash, c.perfil] }
    );
    c.id = rows[0].id;
  }
  await Movimentacao.destroy({ where: {} });
  await Tarefa.destroy({ where: {} });
});

after(async () => {
  servidor?.close();
  await sequelize.close();
});

const t = (nome, fn) => test(nome, { skip: seguro ? false : "defina PGDATABASE=algo_teste para rodar" }, fn);

// ---------------- autenticação (401) ----------------
t("login: sucesso devolve tokens, perfil e permissões", async () => {
  for (const [nome, c] of Object.entries(contas)) {
    const r = await chamar(null, "POST", "/auth/login", { email: c.email, senha: SENHA });
    assert.equal(r.status, 200);
    assert.equal(r.dados.usuario.perfil, c.perfil);
    assert.ok(r.dados.accessToken && r.dados.refreshToken);
    assert.ok(Array.isArray(r.dados.usuario.permissoes));
    assert.equal("senha_hash" in r.dados.usuario, false);
    tokens[nome] = r.dados.accessToken;
    c.refresh = r.dados.refreshToken;
  }
});

t("login: senha errada e e-mail inexistente dão a mesma resposta 401", async () => {
  const a = await chamar(null, "POST", "/auth/login", { email: contas.analista.email, senha: "errada123" });
  const b = await chamar(null, "POST", "/auth/login", { email: "nao@existe.com", senha: "errada123" });
  assert.equal(a.status, 401);
  assert.equal(b.status, 401);
  assert.equal(a.dados.erro, b.dados.erro);
});

t("login: corpo inválido dá 400", async () => {
  assert.equal((await chamar(null, "POST", "/auth/login", { email: "x" })).status, 400);
});

t("sem token ou com token falso: 401 em rota protegida", async () => {
  assert.equal((await chamar(null, "GET", "/movimentacoes")).status, 401);
  const r = await fetch(base + "/movimentacoes", { headers: { Authorization: "Bearer lixo" } });
  assert.equal(r.status, 401);
});

t("GET /auth/eu devolve o usuário logado", async () => {
  const r = await chamar("gestor", "GET", "/auth/eu");
  assert.equal(r.status, 200);
  assert.equal(r.dados.email, contas.gestor.email);
});

t("refresh: renova e invalida o token antigo (rotação + detecção de reuso)", async () => {
  const c = contas.analista;
  const novo = await chamar(null, "POST", "/auth/refresh", { refreshToken: c.refresh });
  assert.equal(novo.status, 200);
  // reutilizar o antigo é tentativa de roubo: 401 e derruba a sessão nova também
  assert.equal((await chamar(null, "POST", "/auth/refresh", { refreshToken: c.refresh })).status, 401);
  assert.equal((await chamar(null, "POST", "/auth/refresh", { refreshToken: novo.dados.refreshToken })).status, 401);
  // login de novo para os testes seguintes
  const r = await chamar(null, "POST", "/auth/login", { email: c.email, senha: SENHA });
  tokens.analista = r.dados.accessToken;
});

t("logout revoga o refresh token", async () => {
  const l = await chamar(null, "POST", "/auth/login", { email: contas.estagiario.email, senha: SENHA });
  assert.equal((await chamar(null, "POST", "/auth/logout", { refreshToken: l.dados.refreshToken })).status, 204);
  assert.equal((await chamar(null, "POST", "/auth/refresh", { refreshToken: l.dados.refreshToken })).status, 401);
});

// ---------------- autorização (403) ----------------
t("estagiário: importa e lê, mas é barrado em análise, relatório, edição e tarefas de gestor", async () => {
  const imp = await chamar("estagiario", "POST", "/importacao", formOfx());
  assert.equal(imp.status, 201);
  assert.ok(imp.dados.inseridas > 0);

  assert.equal((await chamar("estagiario", "GET", "/movimentacoes")).status, 200);
  const manual = await chamar("estagiario", "POST", "/movimentacoes", {
    data_movimentacao: "2026-03-01", valor: -10.5, descricao: "Material de limpeza",
  });
  assert.equal(manual.status, 201);
  assert.equal(manual.dados.categoria, "Material de escritório");

  assert.equal((await chamar("estagiario", "GET", "/analise/resumo")).status, 403);
  assert.equal((await chamar("estagiario", "GET", "/exportacao/csv")).status, 403);
  assert.equal((await chamar("estagiario", "PATCH", `/movimentacoes/${manual.dados.id}`, { categoria: "Outros" })).status, 403);
  assert.equal((await chamar("estagiario", "DELETE", "/movimentacoes")).status, 403);
  assert.equal((await chamar("estagiario", "GET", `/movimentacoes/${manual.dados.id}/comentarios`)).status, 403);
  assert.equal((await chamar("estagiario", "POST", "/tarefas", { titulo: "Tarefa", atribuido_a: 1 })).status, 403);
  assert.equal((await chamar("estagiario", "GET", "/usuarios")).status, 403);
});

t("gestor: vê análise e exporta, mas não importa nem altera contas", async () => {
  const r = await chamar("gestor", "GET", "/analise/resumo");
  assert.equal(r.status, 200);
  assert.ok(r.dados.quantidade > 0);
  assert.equal((await chamar("gestor", "GET", "/exportacao/csv")).status, 200);

  assert.equal((await chamar("gestor", "POST", "/importacao", formOfx())).status, 403);
  assert.equal((await chamar("gestor", "POST", "/movimentacoes", { data_movimentacao: "2026-03-01", valor: 1, descricao: "x" })).status, 403);
  assert.equal((await chamar("gestor", "POST", "/movimentacoes/classificar-automatico")).status, 403);
});

t("analista: classifica, altera e comenta; gestor lê os comentários", async () => {
  const lista = await chamar("analista", "GET", "/movimentacoes");
  const mov = lista.dados[0];

  const edit = await chamar("analista", "PATCH", `/movimentacoes/${mov.id}`, { categoria: "Outros" });
  assert.equal(edit.status, 200);
  assert.equal(edit.dados.categoria, "Outros");
  assert.equal((await chamar("analista", "PATCH", `/movimentacoes/${mov.id}`, { categoria: "Inventada" })).status, 400);
  assert.equal((await chamar("analista", "PATCH", `/movimentacoes/${mov.id}`, {})).status, 400);
  assert.equal((await chamar("analista", "PATCH", "/movimentacoes/999999", { categoria: "Outros" })).status, 404);

  const auto = await chamar("analista", "POST", "/movimentacoes/classificar-automatico");
  assert.equal(auto.status, 200);

  const com = await chamar("analista", "POST", `/movimentacoes/${mov.id}/comentarios`, { texto: "Conferir nota fiscal." });
  assert.equal(com.status, 201);
  assert.equal(com.dados.autor, "Teste analista");

  const lido = await chamar("gestor", "GET", `/movimentacoes/${mov.id}/comentarios`);
  assert.equal(lido.dados.length, 1);
  assert.equal((await chamar("gestor", "POST", `/movimentacoes/${mov.id}/comentarios`, { texto: "oi" })).status, 403);
  assert.equal((await chamar("analista", "POST", `/movimentacoes/${mov.id}/comentarios`, { texto: "  " })).status, 400);
  assert.equal((await chamar("analista", "DELETE", `/comentarios/${com.dados.id}`)).status, 204);
});

t("importação: prévia marca duplicadas e reimportar não duplica", async () => {
  const prev = await chamar("analista", "POST", "/importacao/preview", formOfx());
  assert.equal(prev.status, 200);
  assert.ok(prev.dados.every((p) => p.duplicada === true));
  const again = await chamar("analista", "POST", "/importacao", formOfx());
  assert.equal(again.dados.inseridas, 0);
  assert.ok(again.dados.duplicadas > 0);
});

t("importação: arquivo ausente ou inválido", async () => {
  assert.equal((await chamar("analista", "POST", "/importacao", new FormData())).status, 400);
  const f = new FormData();
  f.append("arquivo", new Blob(["nada a ver"]), "x.ofx");
  assert.equal((await chamar("analista", "POST", "/importacao", f)).status, 422);
});

t("exportação: todos os formatos e formato inválido", async () => {
  const tipos = { csv: "text/csv", xlsx: "spreadsheetml", txt: "text/plain", ofx: "x-ofx" };
  for (const [fmt, esperado] of Object.entries(tipos)) {
    const r = await chamar("gestor", "GET", `/exportacao/${fmt}`);
    assert.equal(r.status, 200, fmt);
    assert.ok(r.headers.get("content-type").includes(esperado), fmt);
    assert.ok(r.dados.length > 0);
  }
  assert.equal((await chamar("gestor", "GET", "/exportacao/pdf")).status, 400);
  // o OFX exportado precisa ser lido de volta pelo nosso importador
  const ofx = await chamar("analista", "GET", "/exportacao/ofx");
  const f = new FormData();
  f.append("arquivo", new Blob([ofx.dados]), "volta.ofx");
  assert.equal((await chamar("analista", "POST", "/importacao/preview", f)).status, 200);
});

// ---------------- tarefas ----------------
t("tarefas: gestor delega, dono atualiza, outro perfil não mexe", async () => {
  const criada = await chamar("gestor", "POST", "/tarefas", {
    titulo: "Balanço de setembro", tipo: "BALANCO", atribuido_a: contas.analista.id, prazo: "2026-10-30",
  });
  assert.equal(criada.status, 201);
  const id = criada.dados.id;

  assert.equal((await chamar("estagiario", "PATCH", `/tarefas/${id}/status`, { status: "CONCLUIDA" })).status, 403);
  assert.equal((await chamar("estagiario", "GET", "/tarefas")).dados.length, 0); // não é dele

  const minhas = await chamar("analista", "GET", "/tarefas");
  assert.equal(minhas.dados.length, 1);
  const andamento = await chamar("analista", "PATCH", `/tarefas/${id}/status`, { status: "EM_ANDAMENTO" });
  assert.equal(andamento.dados.status, "EM_ANDAMENTO");
  const fim = await chamar("analista", "PATCH", `/tarefas/${id}/status`, { status: "CONCLUIDA" });
  assert.ok(fim.dados.concluido_em);
  assert.equal((await chamar("analista", "PATCH", `/tarefas/${id}/status`, { status: "XYZ" })).status, 400);

  assert.equal((await chamar("analista", "DELETE", `/tarefas/${id}`)).status, 403);
  assert.equal((await chamar("gestor", "DELETE", `/tarefas/${id}`)).status, 204);
});

// ---------------- usuários ----------------
t("usuários: só o gestor gerencia; desativar derruba o acesso na hora", async () => {
  assert.equal((await chamar("analista", "GET", "/usuarios")).status, 403);
  const email = "t.novo@teste.com";
  await Usuario.destroy({ where: { email } });

  const novo = await chamar("gestor", "POST", "/usuarios", { nome: "Novo", email, senha: "Senha@1234", perfil: "ESTAGIARIO" });
  assert.equal(novo.status, 201);
  assert.equal("senha_hash" in novo.dados, false);
  assert.equal((await chamar("gestor", "POST", "/usuarios", { nome: "Novo", email, senha: "Senha@1234", perfil: "ESTAGIARIO" })).status, 409);
  assert.equal((await chamar("gestor", "POST", "/usuarios", { nome: "X", email: "a@b.com", senha: "123", perfil: "ROOT" })).status, 400);

  const l = await chamar(null, "POST", "/auth/login", { email, senha: "Senha@1234" });
  tokens.novo = l.dados.accessToken;
  assert.equal((await chamar("novo", "GET", "/auth/eu")).status, 200);

  assert.equal((await chamar("gestor", "PATCH", `/usuarios/${novo.dados.id}`, { ativo: false })).status, 200);
  assert.equal((await chamar("novo", "GET", "/auth/eu")).status, 401);
  assert.equal((await chamar(null, "POST", "/auth/login", { email, senha: "Senha@1234" })).status, 403);

  // gestor não pode se desativar
  assert.equal((await chamar("gestor", "PATCH", `/usuarios/${contas.gestor.id}`, { ativo: false })).status, 400);
  await Usuario.destroy({ where: { email } });
});

t("rota inexistente devolve 404 em JSON", async () => {
  assert.equal((await chamar(null, "GET", "/saude")).status, 200); // pública
  const r = await chamar("analista", "GET", "/nada");
  assert.equal(r.status, 404);
  assert.ok(r.dados.erro);
});
