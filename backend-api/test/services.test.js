// Testes das camadas de serviço, SEM banco: cada serviço recebe um repositório falso.
// Isso só é possível porque as regras de negócio ficam separadas das rotas e do SQL.
import test from "node:test";
import assert from "node:assert/strict";

process.env.JWT_SEGREDO ??= "segredo-so-para-testes-unitarios";

const { TratamentoServico } = await import("../src/modules/treatment/treatment.service.js");
const { TarefasServico } = await import("../src/modules/tasks/tasks.service.js");
const { ComentariosServico } = await import("../src/modules/comments/comments.service.js");
const { UsuariosServico } = await import("../src/modules/users/users.service.js");
const { ImportacaoServico } = await import("../src/modules/import/import.service.js");
const { ExportacaoServico } = await import("../src/modules/export/export.service.js");
const { naoEncontrado } = await import("../src/shared/errors.js");

// ----- tratamento -----
test("tratamento: classificação automática grava só quem ganhou categoria, de uma vez", async () => {
  let gravado;
  const repo = {
    listarSemCategoria: async () => [
      { id: 1, descricao: "Pagamento ALUGUEL" },
      { id: 2, descricao: "Coisa qualquer" },
      { id: 3, descricao: "Conta de energia" },
    ],
    atualizarCategorias: async (itens) => { gravado = itens; return itens.length; },
  };
  const r = await new TratamentoServico(repo).classificarAutomatico({ id: 9 });
  assert.deepEqual(gravado, [{ id: 1, categoria: "Aluguel" }, { id: 3, categoria: "Energia" }]);
  assert.deepEqual(r, { atualizadas: 2 });
});

test("tratamento: lançamento sem categoria usa o classificador", async () => {
  const repo = { criar: async (dados) => dados };
  const criada = await new TratamentoServico(repo).criar({ descricao: "ASSINATURA mensal", valor: -10 }, { id: 1 });
  assert.equal(criada.categoria, "Assinaturas");
});

test("tratamento: duplicada vira 409 e conta inexistente vira 404", async () => {
  const duplicada = Object.assign(new Error("dup"), { code: "23505" });
  const repo = { criar: async () => { throw duplicada; }, atualizar: async () => undefined, apagar: async () => 0 };
  const servico = new TratamentoServico(repo);
  await assert.rejects(servico.criar({ descricao: "x" }, { id: 1 }), { status: 409 });
  await assert.rejects(servico.atualizar(1, {}, { id: 1 }), { status: 404, message: "Movimentação não encontrada." });
  await assert.rejects(servico.apagar(1), { status: 404 });
});

test("erros: concordância do 404 em masculino e feminino", () => {
  assert.equal(naoEncontrado("Usuário").message, "Usuário não encontrado.");
  assert.equal(naoEncontrado("Tarefa", true).message, "Tarefa não encontrada.");
});

// ----- tarefas -----
test("tarefas: quem não é gestor só lista as próprias; gestor lista todas", () => {
  let filtro;
  const servico = new TarefasServico({ listar: (f) => { filtro = f; return []; } });
  servico.listar({ status: "PENDENTE", atribuido_a: 5 }, { id: 2, perfil: "ANALISTA" });
  assert.equal(filtro.dono, 2); // ignora o atribuido_a enviado
  servico.listar({ atribuido_a: 5 }, { id: 3, perfil: "GESTOR" });
  assert.equal(filtro.dono, 5);
});

test("tarefas: só o dono ou o gestor muda o status", async () => {
  const repo = {
    buscarPorId: async () => ({ id: 1, atribuido_a: 2 }),
    atualizarStatus: async () => {},
  };
  const servico = new TarefasServico(repo);
  await assert.rejects(servico.mudarStatus(1, "CONCLUIDA", { id: 7, perfil: "ESTAGIARIO" }), { status: 403 });
  await servico.mudarStatus(1, "CONCLUIDA", { id: 2, perfil: "ANALISTA" });
  await servico.mudarStatus(1, "CONCLUIDA", { id: 9, perfil: "GESTOR" });
});

test("tarefas: não atribui para usuário inativo", async () => {
  const servico = new TarefasServico({ usuarioAtivo: async () => false });
  await assert.rejects(servico.criar({ atribuido_a: 4 }, { id: 1 }), { status: 400 });
});

// ----- comentários -----
test("comentários: só o autor apaga e conta inexistente dá 404", async () => {
  const repo = {
    buscarAutor: async (id) => (id === 1 ? 10 : undefined),
    movimentacaoExiste: async () => false,
    apagar: async () => {},
  };
  const servico = new ComentariosServico(repo);
  await assert.rejects(servico.apagar(1, { id: 11 }), { status: 403 });
  await assert.rejects(servico.apagar(2, { id: 10 }), { status: 404 });
  await servico.apagar(1, { id: 10 });
  await assert.rejects(servico.criar(1, "oi", { id: 10 }), { status: 404 });
});

// ----- usuários -----
test("usuários: gestor não desativa nem rebaixa a própria conta; desativar derruba sessões", async () => {
  let revogado;
  const repo = { atualizar: async (id, d) => ({ id, ...d }) };
  const servico = new UsuariosServico(repo, { revogarTodos: async (id) => { revogado = id; } });
  const gestor = { id: 1, perfil: "GESTOR" };
  await assert.rejects(servico.atualizar(1, { ativo: false }, gestor), { status: 400 });
  await assert.rejects(servico.atualizar(1, { perfil: "ANALISTA" }, gestor), { status: 400 });
  await servico.atualizar(2, { ativo: false }, gestor);
  assert.equal(revogado, 2);
});

// ----- importação -----
test("importação: prévia marca duplicadas e importar conta as puladas", async () => {
  const movimentos = [
    { data: "2026-01-05", valor: -10, descricao: "A", categoria: "Outros" },
    { data: "2026-01-06", valor: -20, descricao: "B", categoria: "Outros" },
  ];
  const repo = {
    buscarExistentes: async () => [{ data: "2026-01-05", valor: -10, descricao: "A" }],
    inserirLote: async () => 1,
  };
  const servico = new ImportacaoServico(repo, () => movimentos);
  const arquivo = { buffer: Buffer.from("") };
  assert.deepEqual((await servico.previa(arquivo)).map((m) => m.duplicada), [true, false]);
  assert.deepEqual(await servico.importar(arquivo, { id: 1 }), { inseridas: 1, duplicadas: 1 });
  await assert.rejects(servico.previa(undefined), { status: 400 });
});

// ----- exportação -----
test("exportação: OFX vazio é recusado e o nome do arquivo sai com a extensão", async () => {
  const formatos = { csv: () => ({ buffer: Buffer.from("x"), tipo: "text/csv" }), ofx: () => ({}) };
  const vazio = new ExportacaoServico({ listarTodas: async () => [] }, formatos);
  await assert.rejects(vazio.exportar("ofx"), { status: 400 });
  assert.equal((await vazio.exportar("csv")).nome, "movimentacoes.csv");
});
