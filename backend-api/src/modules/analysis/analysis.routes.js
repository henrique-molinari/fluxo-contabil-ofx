// Rotas do painel de análise. As contas ficam em analysis.service.js; aqui só tratamos HTTP.
import { Router } from "express";
import { z } from "zod";
import { assincrono } from "../../shared/asyncHandler.js";
import { autenticar } from "../../shared/middlewares/authenticate.js";
import { autorizar } from "../../shared/middlewares/authorize.js";
import { validar } from "../../shared/middlewares/validate.js";
import { dataISO } from "../../shared/schemas.js";
import { analiseServico as servico } from "./analysis.service.js";

// Filtro opcional de período (?de=2026-01-01&ate=2026-01-31)
const periodo = { query: z.object({ de: dataISO.optional(), ate: dataISO.optional() }) };

const router = Router();
router.use(autenticar, autorizar("analise:ler"));

// Totais e dados dos gráficos
router.get("/resumo", validar(periodo), assincrono(async (req, res) => {
  res.json(await servico.resumo(req.query));
}));

export default router;
