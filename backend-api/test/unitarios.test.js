// Testes que não precisam de banco:  npm test
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

process.env.JWT_SEGREDO ??= "segredo-so-para-testes-unitarios";

const { lerOfx } = await import("../src/modulos/importacao/ofx.parser.js");
const { classificar } = await import("../src/modulos/tratamento/classificador.js");
const { calcularResumo } = await import("../src/modulos/analise/analise.rotas.js");
const { temPermissao, PERMISSOES, PERFIS } = await import("../src/config/permissoes.js");

const exemplos = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../api/exemplos");

test("classificador: ignora acento e maiúsculas", () => {
  assert.equal(classificar("Pagamento ALUGUEL sala"), "Aluguel");
  assert.equal(classificar("Estacionamento centro"), "Veículo");
  assert.equal(classificar("VEÍCULO - revisão"), "Veículo");
  assert.equal(classificar("Coisa qualquer"), "Sem categoria");
});

test("parser OFX: lê o extrato de exemplo", () => {
  const movs = lerOfx(fs.readFileSync(path.join(exemplos, "extrato.ofx")));
  assert.ok(movs.length > 0);
  for (const m of movs) {
    assert.match(m.data, /^\d{4}-\d{2}-\d{2}$/);
    assert.equal(typeof m.valor, "number");
    assert.ok(m.descricao.length > 0);
  }
});

test("parser OFX: tags sem fechamento, vírgula decimal e entidades", () => {
  const ofx = `OFXHEADER:100\nENCODING:UTF-8\n<OFX><BANKTRANLIST>
    <STMTTRN><DTPOSTED>20260105120000<TRNAMT>-1.234,50<MEMO>Aluguel &amp; condom&iacute;nio
    <STMTTRN><DTPOSTED>20260106<TRNAMT>99.9<NAME>Recebimento
    </BANKTRANLIST></OFX>`;
  const [a, b] = lerOfx(Buffer.from(ofx));
  assert.deepEqual([a.data, a.valor, a.categoria], ["2026-01-05", -1234.5, "Aluguel"]);
  assert.equal(a.descricao, "Aluguel & condom&iacute;nio");
  assert.deepEqual([b.data, b.valor, b.descricao], ["2026-01-06", 99.9, "Recebimento"]);
});

test("parser OFX: rejeita arquivo inválido", () => {
  assert.throws(() => lerOfx(Buffer.from("isto não é ofx")), { status: 422 });
  assert.throws(() => lerOfx(Buffer.from("<OFX></OFX>")), { status: 422 });
  assert.throws(() => lerOfx(Buffer.from("<OFX><STMTTRN><DTPOSTED>20261340<TRNAMT>1</STMTTRN></OFX>")), { status: 422 });
});

test("resumo: totais, saldo acumulado e categorias", () => {
  const r = calcularResumo([
    { data_movimentacao: "2026-01-02", valor: 1000, categoria: "Receitas" },
    { data_movimentacao: "2026-01-03", valor: -300, categoria: "Aluguel" },
    { data_movimentacao: "2026-02-01", valor: -100.1, categoria: "Aluguel" },
  ]);
  assert.equal(r.entradas, 1000);
  assert.equal(r.saidas, -400.1);
  assert.equal(r.saldo, 599.9);
  assert.deepEqual(r.por_categoria, [{ categoria: "Aluguel", total: 400.1 }]);
  assert.deepEqual(r.evolucao.map((e) => e.saldo), [1000, 700, 599.9]);
  assert.equal(r.por_mes.length, 2);
});

test("permissões: o que cada perfil pode", () => {
  // Estagiário: lança dados, mas não vê gráficos nem tira relatório
  assert.ok(temPermissao(PERFIS.ESTAGIARIO, "importacao:criar"));
  assert.ok(!temPermissao(PERFIS.ESTAGIARIO, "analise:ler"));
  assert.ok(!temPermissao(PERFIS.ESTAGIARIO, "relatorios:exportar"));
  assert.ok(!temPermissao(PERFIS.ESTAGIARIO, "movimentacoes:editar"));
  // Analista: altera e comenta
  assert.ok(temPermissao(PERFIS.ANALISTA, "movimentacoes:editar"));
  assert.ok(temPermissao(PERFIS.ANALISTA, "comentarios:criar"));
  assert.ok(!temPermissao(PERFIS.ANALISTA, "tarefas:criar"));
  // Gestor: vê gráficos e delega, mas não mexe nas contas
  assert.ok(temPermissao(PERFIS.GESTOR, "analise:ler"));
  assert.ok(temPermissao(PERFIS.GESTOR, "tarefas:criar"));
  assert.ok(!temPermissao(PERFIS.GESTOR, "movimentacoes:editar"));
  assert.ok(!temPermissao(PERFIS.GESTOR, "importacao:criar"));
  // Nenhuma permissão aponta para perfil inexistente
  for (const perfis of Object.values(PERMISSOES)) for (const p of perfis) assert.ok(PERFIS[p]);
});
