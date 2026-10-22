// Tarefas delegadas. O gestor cria e atribui (ex.: "Preciso do balanço de setembro");
// cada pessoa vê as suas e atualiza o andamento. Só o gestor enxerga todas.
import { Router } from "express";
import { z } from "zod";
import { consultar } from "../../compartilhado/db.js";
import { ErroHttp, naoEncontrado } from "../../compartilhado/erros.js";
import { assincrono } from "../../compartilhado/asyncHandler.js";
import { autenticar } from "../../compartilhado/middlewares/autenticar.js";
import { autorizar } from "../../compartilhado/middlewares/autorizar.js";
import { validar } from "../../compartilhado/middlewares/validar.js";
import { dataISO, idParam } from "../../compartilhado/schemas.js";
import { PERFIS } from "../../config/permissoes.js";

// Ciclo de vida de uma tarefa
const STATUS = ["PENDENTE", "EM_ANDAMENTO", "CONCLUIDA"];

const schemas = {
  listar: { query: z.object({ status: z.enum(STATUS).optional(), atribuido_a: z.coerce.number().int().positive().optional() }) },
  criar: {
    body: z.object({
      titulo: z.string().trim().min(3, "Título muito curto.").max(160),
      descricao: z.string().trim().max(2000).optional(),
      tipo: z.enum(["GERAL", "BALANCO"]).default("GERAL"),
      atribuido_a: z.number().int().positive(),
      prazo: dataISO.optional(),
    }),
  },
  status: { params: idParam, body: z.object({ status: z.enum(STATUS, { errorMap: () => ({ message: `Status inválido. Use: ${STATUS.join(", ")}.` }) }) }) },
};

// Consulta base: traz também o nome de quem criou e de quem recebeu a tarefa
const SELECT = `SELECT t.id, t.titulo, t.descricao, t.tipo, t.status, t.prazo, t.criado_em, t.concluido_em,
                       t.criado_por, c.nome AS criado_por_nome, t.atribuido_a, a.nome AS atribuido_a_nome
                  FROM tarefas t
                  JOIN usuarios c ON c.id = t.criado_por
                  JOIN usuarios a ON a.id = t.atribuido_a`;

const router = Router();
router.use(autenticar);

// Lista: pendentes primeiro, depois por prazo mais próximo
router.get("/", autorizar("tarefas:ler"), validar(schemas.listar), assincrono(async (req, res) => {
  const { status, atribuido_a } = req.query;
  const ehGestor = req.usuario.perfil === PERFIS.GESTOR;
  // Quem não é gestor só enxerga as tarefas atribuídas a si mesmo
  const dono = ehGestor ? atribuido_a ?? null : req.usuario.id;
  const { rows } = await consultar(
    `${SELECT}
      WHERE ($1::int IS NULL OR t.atribuido_a = $1) AND ($2::text IS NULL OR t.status = $2)
      ORDER BY (t.status = 'CONCLUIDA'), t.prazo NULLS LAST, t.criado_em DESC`,
    [dono, status ?? null]
  );
  res.json(rows);
}));

// Só o gestor cria. A tarefa precisa ser atribuída a um usuário ativo.
router.post("/", autorizar("tarefas:criar"), validar(schemas.criar), assincrono(async (req, res) => {
  const b = req.body;
  const { rows: alvo } = await consultar("SELECT ativo FROM usuarios WHERE id = $1", [b.atribuido_a]);
  if (!alvo[0]?.ativo) throw new ErroHttp(400, "Usuário de destino não existe ou está desativado.");

  const { rows } = await consultar(
    `INSERT INTO tarefas (titulo, descricao, tipo, atribuido_a, prazo, criado_por)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [b.titulo, b.descricao ?? null, b.tipo, b.atribuido_a, b.prazo ?? null, req.usuario.id]
  );
  const { rows: criada } = await consultar(`${SELECT} WHERE t.id = $1`, [rows[0].id]);
  res.status(201).json(criada[0]);
}));

router.patch("/:id/status", autorizar("tarefas:atualizar"), validar(schemas.status), assincrono(async (req, res) => {
  const { rows } = await consultar("SELECT atribuido_a FROM tarefas WHERE id = $1", [req.params.id]);
  if (!rows[0]) throw naoEncontrado("Tarefa");

  // Só o gestor mexe em tarefa de outra pessoa
  const ehGestor = req.usuario.perfil === PERFIS.GESTOR;
  if (!ehGestor && rows[0].atribuido_a !== req.usuario.id) {
    throw new ErroHttp(403, "Esta tarefa não está atribuída a você.");
  }

  // Ao concluir grava a data/hora; ao reabrir, limpa
  const { status } = req.body;
  await consultar(
    "UPDATE tarefas SET status = $2, concluido_em = CASE WHEN $3 THEN now() ELSE NULL END WHERE id = $1",
    [req.params.id, status, status === "CONCLUIDA"]
  );
  const { rows: atualizada } = await consultar(`${SELECT} WHERE t.id = $1`, [req.params.id]);
  res.json(atualizada[0]);
}));

// Só o gestor exclui
router.delete("/:id", autorizar("tarefas:excluir"), validar({ params: idParam }), assincrono(async (req, res) => {
  const { rowCount } = await consultar("DELETE FROM tarefas WHERE id = $1", [req.params.id]);
  if (!rowCount) throw naoEncontrado("Tarefa");
  res.status(204).end();
}));

export default router;
