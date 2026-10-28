// Rotas da gestão de usuários: só quem tem "usuarios:gerenciar" (o gestor).
// As regras ficam em users.service.js; aqui só tratamos HTTP.
import { Router } from "express";
import { z } from "zod";
import { PERFIS } from "../../config/permissions.js";
import { assincrono } from "../../shared/asyncHandler.js";
import { autenticar } from "../../shared/middlewares/authenticate.js";
import { autorizar } from "../../shared/middlewares/authorize.js";
import { validar } from "../../shared/middlewares/validate.js";
import { idParam, senhaForte } from "../../shared/schemas.js";
import { usuariosServico as servico } from "./users.service.js";

// ----- validações (zod) -----
const perfil = z.enum(Object.values(PERFIS), { errorMap: () => ({ message: "Perfil inválido." }) });

const schemas = {
  criar: {
    body: z.object({
      nome: z.string().trim().min(2).max(120),
      email: z.string().trim().email("E-mail inválido.").max(160),
      senha: senhaForte,
      perfil,
    }),
  },
  atualizar: {
    params: idParam,
    body: z
      .object({ nome: z.string().trim().min(2).max(120), perfil, ativo: z.boolean() })
      .partial()
      .refine((b) => Object.keys(b).length > 0, "Envie pelo menos um campo."),
  },
  redefinirSenha: { params: idParam, body: z.object({ senhaNova: senhaForte }) },
};

const router = Router();
router.use(autenticar, autorizar("usuarios:gerenciar"));

// Lista a equipe
router.get("/", assincrono(async (req, res) => {
  res.json(await servico.listar());
}));

// Cadastra um usuário novo
router.post("/", validar(schemas.criar), assincrono(async (req, res) => {
  res.status(201).json(await servico.criar(req.body));
}));

// Edita nome, perfil ou ativa/desativa
router.patch("/:id", validar(schemas.atualizar), assincrono(async (req, res) => {
  res.json(await servico.atualizar(req.params.id, req.body, req.usuario));
}));

// O gestor define uma senha nova para o usuário
router.post("/:id/redefinir-senha", validar(schemas.redefinirSenha), assincrono(async (req, res) => {
  res.json(await servico.redefinirSenha(req.params.id, req.body.senhaNova));
}));

export default router;
