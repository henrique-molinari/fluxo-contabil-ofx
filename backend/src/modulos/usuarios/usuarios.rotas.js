// Gestão de usuários: só quem tem "usuarios:gerenciar" (o gestor).
import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { PERFIS } from "../../config/permissoes.js";
import { consultar } from "../../compartilhado/db.js";
import { ErroHttp, naoEncontrado } from "../../compartilhado/erros.js";
import { assincrono } from "../../compartilhado/asyncHandler.js";
import { autenticar } from "../../compartilhado/middlewares/autenticar.js";
import { autorizar } from "../../compartilhado/middlewares/autorizar.js";
import { validar } from "../../compartilhado/middlewares/validar.js";
import { idParam, senhaForte } from "../../compartilhado/schemas.js";
import { revogarTodos } from "../auth/auth.servico.js";

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

// Nunca devolvemos senha_hash para o cliente
const COLUNAS = "id, nome, email, perfil, ativo, criado_em";

const router = Router();
router.use(autenticar, autorizar("usuarios:gerenciar"));

// Lista a equipe
router.get("/", assincrono(async (req, res) => {
  const { rows } = await consultar(`SELECT ${COLUNAS} FROM usuarios ORDER BY nome`);
  res.json(rows);
}));

// Cadastra um usuário novo; a senha é guardada como hash bcrypt (nunca em texto)
router.post("/", validar(schemas.criar), assincrono(async (req, res) => {
  const { nome, email, senha, perfil } = req.body;
  const { rows } = await consultar(
    `INSERT INTO usuarios (nome, email, senha_hash, perfil) VALUES ($1, $2, $3, $4) RETURNING ${COLUNAS}`,
    [nome, email, await bcrypt.hash(senha, 10), perfil]
  ).catch((e) => {
    if (e.code === "23505") throw new ErroHttp(409, "Já existe um usuário com este e-mail.");
    throw e;
  });
  res.status(201).json(rows[0]);
}));

// Edita nome, perfil ou ativa/desativa. Desativar também derruba as sessões abertas da pessoa.
router.patch("/:id", validar(schemas.atualizar), assincrono(async (req, res) => {
  const { id } = req.params;
  const { nome, perfil, ativo } = req.body;

  // Evita o gestor se trancar para fora do sistema
  if (id === req.usuario.id && (ativo === false || (perfil && perfil !== req.usuario.perfil))) {
    throw new ErroHttp(400, "Você não pode desativar nem mudar o perfil da sua própria conta.");
  }

  const { rows } = await consultar(
    `UPDATE usuarios SET nome = COALESCE($2, nome), perfil = COALESCE($3, perfil), ativo = COALESCE($4, ativo)
     WHERE id = $1 RETURNING ${COLUNAS}`,
    [id, nome ?? null, perfil ?? null, ativo ?? null]
  );
  if (!rows[0]) throw naoEncontrado("Usuário");
  if (ativo === false) await revogarTodos(id);
  res.json(rows[0]);
}));

// O gestor define uma senha nova; todas as sessões antigas do usuário são encerradas
router.post("/:id/redefinir-senha", validar(schemas.redefinirSenha), assincrono(async (req, res) => {
  const { rowCount } = await consultar("UPDATE usuarios SET senha_hash = $2 WHERE id = $1", [
    req.params.id,
    await bcrypt.hash(req.body.senhaNova, 10),
  ]);
  if (!rowCount) throw naoEncontrado("Usuário");
  await revogarTodos(req.params.id);
  res.json({ ok: true });
}));

export default router;
