// Tratamento das contas: listar, lançar manualmente, alterar, classificar e apagar.
import { Router } from "express";
import { z } from "zod";
import { consultar } from "../../compartilhado/db.js";
import { ErroHttp, naoEncontrado } from "../../compartilhado/erros.js";
import { assincrono } from "../../compartilhado/asyncHandler.js";
import { autenticar } from "../../compartilhado/middlewares/autenticar.js";
import { autorizar } from "../../compartilhado/middlewares/autorizar.js";
import { validar } from "../../compartilhado/middlewares/validar.js";
import { dataISO, idParam } from "../../compartilhado/schemas.js";
import { CATEGORIAS, classificar } from "./classificador.js";

// ----- validações (zod) -----
const categoria = z.enum(CATEGORIAS, { errorMap: () => ({ message: "Categoria inválida." }) });
const valor = z.number().refine((v) => v !== 0 && Math.abs(v) < 1e13, "Valor inválido.");
const descricao = z.string().trim().min(1, "Informe a descrição.").max(255);

const schemas = {
  listar: {
    query: z.object({
      busca: z.string().trim().optional(),
      categoria: categoria.optional(),
      de: dataISO.optional(),
      ate: dataISO.optional(),
    }),
  },
  criar: {
    body: z.object({ data_movimentacao: dataISO, valor, descricao, categoria: categoria.optional() }),
  },
  atualizar: {
    params: idParam,
    body: z
      .object({ data_movimentacao: dataISO, valor, descricao, categoria })
      .partial()
      .refine((b) => Object.keys(b).length > 0, "Envie pelo menos um campo."),
  },
};

// Colunas devolvidas ao cliente (sem campos internos de auditoria)
const COLUNAS = "id, data_movimentacao, valor, descricao, categoria";

const router = Router();
// Todas as rotas daqui exigem login; cada uma pede sua permissão
router.use(autenticar);

// Lista de categorias para preencher os seletores da tela
router.get("/categorias", autorizar("movimentacoes:ler"), (req, res) => res.json(CATEGORIAS));

// Lista com filtros opcionais. O padrão ($1 IS NULL OR ...) ignora o filtro quando não foi enviado.
router.get("/movimentacoes", autorizar("movimentacoes:ler"), validar(schemas.listar), assincrono(async (req, res) => {
  const { busca, categoria: cat, de, ate } = req.query;
  const { rows } = await consultar(
    `SELECT m.id, m.data_movimentacao, m.valor, m.descricao, m.categoria,
            (SELECT count(*)::int FROM comentarios c WHERE c.movimentacao_id = m.id) AS qtd_comentarios
       FROM movimentacoes m
      WHERE ($1::text IS NULL OR m.descricao ILIKE '%' || $1 || '%')
        AND ($2::text IS NULL OR m.categoria = $2)
        AND ($3::date IS NULL OR m.data_movimentacao >= $3)
        AND ($4::date IS NULL OR m.data_movimentacao <= $4)
      ORDER BY m.data_movimentacao DESC, m.id DESC`,
    [busca || null, cat ?? null, de ?? null, ate ?? null]
  );
  res.json(rows);
}));

// Lançamento manual: se não vier categoria, o classificador escolhe pela descrição
router.post("/movimentacoes", autorizar("movimentacoes:criar"), validar(schemas.criar), assincrono(async (req, res) => {
  const b = req.body;
  const { rows } = await consultar(
    `INSERT INTO movimentacoes (data_movimentacao, valor, descricao, categoria, criado_por)
     VALUES ($1, $2, $3, $4, $5) RETURNING ${COLUNAS}`,
    [b.data_movimentacao, b.valor, b.descricao, b.categoria ?? classificar(b.descricao), req.usuario.id]
  ).catch((e) => {
    if (e.code === "23505") throw new ErroHttp(409, "Já existe uma movimentação igual (data, valor e descrição).");
    throw e;
  });
  res.status(201).json(rows[0]);
}));

// Atualização parcial: COALESCE mantém o valor atual dos campos que não foram enviados.
// Também registra quem alterou e quando (auditoria).
router.patch("/movimentacoes/:id", autorizar("movimentacoes:editar"), validar(schemas.atualizar), assincrono(async (req, res) => {
  const b = req.body;
  const { rows } = await consultar(
    `UPDATE movimentacoes SET
        data_movimentacao = COALESCE($2, data_movimentacao),
        valor             = COALESCE($3, valor),
        descricao         = COALESCE($4, descricao),
        categoria         = COALESCE($5, categoria),
        alterado_por = $6, alterado_em = now()
      WHERE id = $1 RETURNING ${COLUNAS}`,
    [req.params.id, b.data_movimentacao ?? null, b.valor ?? null, b.descricao ?? null, b.categoria ?? null, req.usuario.id]
  ).catch((e) => {
    if (e.code === "23505") throw new ErroHttp(409, "Já existe uma movimentação igual (data, valor e descrição).");
    throw e;
  });
  if (!rows[0]) throw naoEncontrado("Movimentação");
  res.json(rows[0]);
}));

// Aplica as regras automáticas em tudo que ainda está "Sem categoria"
router.post("/movimentacoes/classificar-automatico", autorizar("movimentacoes:editar"), assincrono(async (req, res) => {
  const { rows } = await consultar("SELECT id, descricao FROM movimentacoes WHERE categoria = 'Sem categoria'");
  let atualizadas = 0;
  for (const { id, descricao: d } of rows) {
    const nova = classificar(d);
    if (nova === "Sem categoria") continue;
    await consultar("UPDATE movimentacoes SET categoria = $2, alterado_por = $3, alterado_em = now() WHERE id = $1", [id, nova, req.usuario.id]);
    atualizadas++;
  }
  res.json({ atualizadas });
}));

// Apaga uma conta
router.delete("/movimentacoes/:id", autorizar("movimentacoes:apagar"), validar({ params: idParam }), assincrono(async (req, res) => {
  const { rowCount } = await consultar("DELETE FROM movimentacoes WHERE id = $1", [req.params.id]);
  if (!rowCount) throw naoEncontrado("Movimentação");
  res.status(204).end();
}));

// Apaga todas as contas (os comentários vão junto por causa do ON DELETE CASCADE)
router.delete("/movimentacoes", autorizar("movimentacoes:apagar"), assincrono(async (req, res) => {
  const { rowCount } = await consultar("DELETE FROM movimentacoes");
  res.json({ apagadas: rowCount });
}));

export default router;
