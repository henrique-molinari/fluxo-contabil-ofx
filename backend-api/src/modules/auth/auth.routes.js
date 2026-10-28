// Rotas de autenticação: /api/auth/login, refresh, logout, eu e trocar-senha.
// A lógica de verdade fica em auth.service.js; aqui só validamos a entrada e chamamos o serviço.
import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { assincrono } from "../../shared/asyncHandler.js";
import { autenticar } from "../../shared/middlewares/authenticate.js";
import { senhaForte } from "../../shared/schemas.js";
import { validar } from "../../shared/middlewares/validate.js";
import { authServico as servico } from "./auth.service.js";

// Formato esperado do corpo de cada requisição
const schemas = {
  login: { body: z.object({ email: z.string().email("E-mail inválido."), senha: z.string().min(1, "Informe a senha.") }) },
  refresh: { body: z.object({ refreshToken: z.string().min(1, "Informe o refreshToken.") }) },
  trocarSenha: { body: z.object({ senhaAtual: z.string().min(1), senhaNova: senhaForte }) },
};

// Limita tentativas de login por IP (freia ataque de força bruta). Desligado nos testes.
const limitarLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === "test",
  message: { erro: "Muitas tentativas de login. Tente novamente em alguns minutos." },
});

const router = Router();

// ----- públicas (não exigem token) -----
router.post("/login", limitarLogin, validar(schemas.login), assincrono(async (req, res) => {
  res.json(await servico.login(req.body.email, req.body.senha));
}));

router.post("/refresh", validar(schemas.refresh), assincrono(async (req, res) => {
  res.json(await servico.renovar(req.body.refreshToken));
}));

router.post("/logout", validar(schemas.refresh), assincrono(async (req, res) => {
  await servico.logout(req.body.refreshToken);
  res.status(204).end();
}));

// ----- exigem estar autenticado (qualquer perfil) -----
router.get("/eu", autenticar, (req, res) => {
  res.json(servico.dadosPublicos(req.usuario));
});

router.post("/trocar-senha", autenticar, validar(schemas.trocarSenha), assincrono(async (req, res) => {
  await servico.trocarSenha(req.usuario.id, req.body.senhaAtual, req.body.senhaNova);
  res.json({ ok: true, mensagem: "Senha alterada. Faça login novamente nos outros dispositivos." });
}));

export default router;
