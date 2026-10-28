// Rotas das tarefas delegadas.
// As regras ficam em tasks.service.js; aqui só tratamos validação, permissão e resposta HTTP.
import { Router } from "express";
import { z } from "zod";
import { assincrono } from "../../shared/asyncHandler.js";
import { autenticar } from "../../shared/middlewares/authenticate.js";
import { autorizar } from "../../shared/middlewares/authorize.js";
import { validar } from "../../shared/middlewares/validate.js";
import { dataISO, idParam } from "../../shared/schemas.js";
import { STATUS, tarefasServico as servico } from "./tasks.service.js";

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

const router = Router();
router.use(autenticar);

// Lista as tarefas (o gestor vê todas; os outros, só as suas)
router.get("/", autorizar("tarefas:ler"), validar(schemas.listar), assincrono(async (req, res) => {
  res.json(await servico.listar(req.query, req.usuario));
}));

// Só o gestor cria
router.post("/", autorizar("tarefas:criar"), validar(schemas.criar), assincrono(async (req, res) => {
  res.status(201).json(await servico.criar(req.body, req.usuario));
}));

// Muda o andamento da tarefa
router.patch("/:id/status", autorizar("tarefas:atualizar"), validar(schemas.status), assincrono(async (req, res) => {
  res.json(await servico.mudarStatus(req.params.id, req.body.status, req.usuario));
}));

// Só o gestor exclui
router.delete("/:id", autorizar("tarefas:excluir"), validar({ params: idParam }), assincrono(async (req, res) => {
  await servico.excluir(req.params.id);
  res.status(204).end();
}));

export default router;
