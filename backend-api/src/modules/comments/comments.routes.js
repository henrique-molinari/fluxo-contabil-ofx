// Rotas dos comentários nas contas. O analista fiscal comenta; analista e gestor leem.
// As regras ficam em comments.service.js; aqui só tratamos HTTP.
import { Router } from "express";
import { z } from "zod";
import { assincrono } from "../../shared/asyncHandler.js";
import { autenticar } from "../../shared/middlewares/authenticate.js";
import { autorizar } from "../../shared/middlewares/authorize.js";
import { validar } from "../../shared/middlewares/validate.js";
import { idParam } from "../../shared/schemas.js";
import { comentariosServico as servico } from "./comments.service.js";

const schemas = {
  criar: { params: idParam, body: z.object({ texto: z.string().trim().min(1, "Escreva o comentário.").max(2000) }) },
};

const router = Router();
router.use(autenticar);

// Lista os comentários de uma conta, do mais antigo para o mais novo
router.get("/movimentacoes/:id/comentarios", autorizar("comentarios:ler"), validar({ params: idParam }), assincrono(async (req, res) => {
  res.json(await servico.listar(req.params.id));
}));

// Cria um comentário na conta
router.post("/movimentacoes/:id/comentarios", autorizar("comentarios:criar"), validar(schemas.criar), assincrono(async (req, res) => {
  res.status(201).json(await servico.criar(req.params.id, req.body.texto, req.usuario));
}));

// Apaga um comentário (só o autor)
router.delete("/comentarios/:id", autorizar("comentarios:criar"), validar({ params: idParam }), assincrono(async (req, res) => {
  await servico.apagar(req.params.id, req.usuario);
  res.status(204).end();
}));

export default router;
