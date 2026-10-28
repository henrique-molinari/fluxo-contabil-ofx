// Comentários nas contas. O analista fiscal comenta; analista e gestor leem.
import { Router } from "express";
import { z } from "zod";
import { consultar } from "../../compartilhado/db.js";
import { ErroHttp, naoEncontrado } from "../../compartilhado/erros.js";
import { assincrono } from "../../compartilhado/asyncHandler.js";
import { autenticar } from "../../compartilhado/middlewares/autenticar.js";
import { autorizar } from "../../compartilhado/middlewares/autorizar.js";
import { validar } from "../../compartilhado/middlewares/validar.js";
import { idParam } from "../../compartilhado/schemas.js";

const schemas = {
  criar: { params: idParam, body: z.object({ texto: z.string().trim().min(1, "Escreva o comentário.").max(2000) }) },
};

// Consulta base: traz o comentário já com o nome de quem escreveu
const SELECT = `SELECT c.id, c.movimentacao_id, c.texto, c.criado_em, u.id AS autor_id, u.nome AS autor
                  FROM comentarios c JOIN usuarios u ON u.id = c.usuario_id`;

const router = Router();
router.use(autenticar);

// Lista os comentários de uma conta, do mais antigo para o mais novo
router.get("/movimentacoes/:id/comentarios", autorizar("comentarios:ler"), validar({ params: idParam }), assincrono(async (req, res) => {
  const { rows } = await consultar(`${SELECT} WHERE c.movimentacao_id = $1 ORDER BY c.criado_em`, [req.params.id]);
  res.json(rows);
}));

// Cria um comentário (antes confere se a conta existe para devolver um 404 claro)
router.post("/movimentacoes/:id/comentarios", autorizar("comentarios:criar"), validar(schemas.criar), assincrono(async (req, res) => {
  const { rows: mov } = await consultar("SELECT 1 FROM movimentacoes WHERE id = $1", [req.params.id]);
  if (!mov[0]) throw naoEncontrado("Movimentação");

  const { rows } = await consultar(
    "INSERT INTO comentarios (movimentacao_id, usuario_id, texto) VALUES ($1, $2, $3) RETURNING id",
    [req.params.id, req.usuario.id, req.body.texto]
  );
  const { rows: criado } = await consultar(`${SELECT} WHERE c.id = $1`, [rows[0].id]);
  res.status(201).json(criado[0]);
}));

// Só o próprio autor apaga o seu comentário
router.delete("/comentarios/:id", autorizar("comentarios:criar"), validar({ params: idParam }), assincrono(async (req, res) => {
  const { rows } = await consultar("SELECT usuario_id FROM comentarios WHERE id = $1", [req.params.id]);
  if (!rows[0]) throw naoEncontrado("Comentário");
  if (rows[0].usuario_id !== req.usuario.id) throw new ErroHttp(403, "Você só pode apagar os seus próprios comentários.");
  await consultar("DELETE FROM comentarios WHERE id = $1", [req.params.id]);
  res.status(204).end();
}));

export default router;
