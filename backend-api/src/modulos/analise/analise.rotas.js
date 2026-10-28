// Rotas do painel de análise. As contas ficam em analise.servico.js; aqui só tratamos HTTP.
import { Router } from "express";
import { z } from "zod";
import { assincrono } from "../../compartilhado/asyncHandler.js";
import { autenticar } from "../../compartilhado/middlewares/autenticar.js";
import { autorizar } from "../../compartilhado/middlewares/autorizar.js";
import { validar } from "../../compartilhado/middlewares/validar.js";
import { dataISO } from "../../compartilhado/schemas.js";
import { analiseServico as servico } from "./analise.servico.js";

// Filtro opcional de período (?de=2026-01-01&ate=2026-01-31)
const periodo = { query: z.object({ de: dataISO.optional(), ate: dataISO.optional() }) };

const router = Router();
router.use(autenticar, autorizar("analise:ler"));

// Totais e dados dos gráficos
router.get("/resumo", validar(periodo), assincrono(async (req, res) => {
  res.json(await servico.resumo(req.query));
}));

export default router;
